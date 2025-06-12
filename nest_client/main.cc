#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <libgen.h>
#include <stdint.h>
#include <unistd.h>
#include <sys/fcntl.h>
#include <string.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <vector>
#include <arpa/inet.h>
#include <sys/poll.h>
#include <memory>
#include <sys/dir.h>
#include <sys/inotify.h>
#include <errno.h>
#include <string>
#include <algorithm>
#include <sys/epoll.h>
#include <sys/mman.h>
typedef struct {
    uint64_t pfn : 55;
    unsigned int soft_dirty : 1;
    unsigned int file_page : 1;
    unsigned int swapped : 1;
    unsigned int present : 1;
} PagemapEntry;
enum MessageTypes {
  CONNECT=0,
  DISCONNECT,
  DATA,
  RESPONSE,
  PROTOBUF
};
typedef struct {
  uint32_t msgType;
  int msgId;
  char message[];
} ProtocolWrapper;
typedef struct {
  uint32_t RequestSize;
  char cmd[];
} ConnectRequest;
typedef struct {
  int connId;
  size_t msgLen;
  char data[];
} DataPkt;
typedef struct {
  int connId;
  size_t maxMsgLen;
  char data[];
} RecvPkt;
typedef struct {
  int id;
} Disconnect;
typedef struct {
  int id;
  int error;
} ConnectResponse;
typedef struct {
  int connectionid; 
  int stdinFd, stdoutFd, stderrFd;
  int active = 1;
} ActiveConnection;
typedef struct {
  DIR* dent;
  int stream;
} DirectoryStream;

typedef struct {
  size_t msgLength;
  char message[];
} Protobuf;
static int nextConnectionId = 0;
static std::vector<ActiveConnection> activeConnection;
static std::vector<DirectoryStream> dirStreams;
static char* ipc_buffer_rx;
static char* ipc_buffer_tx;
void OnProtobufRequestReceived() {
  
}
int pagemap_get_entry(PagemapEntry *entry, int pagemap_fd, uintptr_t vaddr) {
    size_t nread;
    ssize_t ret;
    uint64_t data;
    uintptr_t vpn;
  
    vpn = vaddr / sysconf(_SC_PAGE_SIZE);
    nread = 0;
    while (nread < sizeof(data)) {
      ret = pread(pagemap_fd, ((uint8_t *)&data) + nread, sizeof(data) - nread,
                  vpn * sizeof(data) + nread);
      nread += ret;
      if (ret <= 0) {
        return 1;
      }
    }
    entry->pfn = data & (((uint64_t)1 << 55) - 1);
    entry->soft_dirty = (data >> 55) & 1;
    entry->file_page = (data >> 61) & 1;
    entry->swapped = (data >> 62) & 1;
    entry->present = (data >> 63) & 1;
    return 0;
}
int virt_to_phys_user(uintptr_t *paddr, pid_t pid, uintptr_t vaddr) {
    char pagemap_file[BUFSIZ];
    int pagemap_fd;
  
    snprintf(pagemap_file, sizeof(pagemap_file), "/proc/%ju/pagemap",
             (uintmax_t)pid);
    pagemap_fd = open(pagemap_file, O_RDONLY);
    if (pagemap_fd < 0) {
      return 1;
    }
    PagemapEntry entry;
    if (pagemap_get_entry(&entry, pagemap_fd, vaddr)) {
      return 1;
    }
    close(pagemap_fd);
    *paddr =
        (entry.pfn * sysconf(_SC_PAGE_SIZE)) + (vaddr % sysconf(_SC_PAGE_SIZE));
    return 0;
}
int findFirstInactiveConnection() {
  for (int i = 0; i < activeConnection.size();i++) {
    if (!activeConnection.at(i).active) {
      return i;
    }
  }
  return -1;
}

int inotify_poll_loop() {

}

const size_t kChunkSize = 1500;
int main(int argc, char const *argv[])
{ 

    ipc_buffer_rx = (char*) mmap(NULL, 1024 * 1024 * 4, PROT_READ|PROT_WRITE, MAP_SHARED|MAP_ANONYMOUS, -1, 0);

    ipc_buffer_tx = (char*) mmap(NULL, 1024 * 1024 * 4, PROT_READ|PROT_WRITE, MAP_SHARED|MAP_ANONYMOUS, -1, 0);
memset(ipc_buffer_rx, 0, 65536);
memset(ipc_buffer_tx, 0, 65536);
    printf("%p\n", ipc_buffer_rx);
    uintptr_t physaddr = -1;
    uintptr_t physaddr_tx = -1;
    if (virt_to_phys_user(&physaddr, getpid(), (uintptr_t) ipc_buffer_rx)) {
        perror("Couldn't obtain physical address for ipc_buffer_rx.");
        return 0;
    };
    if (virt_to_phys_user(&physaddr_tx, getpid(), (uintptr_t) ipc_buffer_tx)) {
      perror("Couldn't obtain physical address for ipc_buffer_tx.");
      return 0;
    };
    printf("ptr%lu %lu\n", physaddr, physaddr_tx);
    FILE* f = fopen("/tmp/sv.log", "wb");
    int hvcFd = open("/dev/hvc0", O_RDWR|O_SYNC);
    
    int m;
    int n =0xa;
    while (true) {
        std::vector<ActiveConnection> connToUpdate;
        
        ProtocolWrapper* rx = (ProtocolWrapper*) (ipc_buffer_rx + 1);

        ProtocolWrapper* tx = (ProtocolWrapper*) (ipc_buffer_tx + 1); 
        read(hvcFd, &m, 1);
        
         
          if (rx->msgType == CONNECT) {
            ConnectRequest* cr = (ConnectRequest*) rx->message;
            uint32_t rpSize = cr->RequestSize;
            char* rpCmd = (char*) cr->cmd;
            rpCmd[rpSize]= '\0';


            
            int stdinFd = memfd_create("stdin-", 0);
            int stdoutFd = memfd_create("stdout-", 0);
            int stderrFd = memfd_create("stderr-", 0);

            int chProc = fork();
            
            if (chProc == 0) {
               const char* z[] = {"sh", "-c", cr->cmd};
                lseek(stdinFd, 0, SEEK_SET);
                dup2(stdinFd, 0);
                dup2(stdoutFd, 1);
                dup2(stderrFd, 2);

               execvp("/bin/busybox", (char*const*)z);
            }else {
              ActiveConnection conn;
              conn.connectionid = findFirstInactiveConnection();
              if (conn.connectionid < 0) {
                conn.connectionid = activeConnection.size();
                
              }
              conn.stdinFd = stdinFd;
              conn.stdoutFd = stdoutFd;
              conn.stderrFd = stderrFd;
              conn.active = true;
              activeConnection.push_back(conn);
              
            }
          }
          if (rx->msgType == DATA) {
            DataPkt* pkt  = (DataPkt*)rx->message;
            ActiveConnection ac = activeConnection.at(pkt->connId);
            write(ac.stdinFd, pkt->data, pkt->msgLen);

          }
          
          
          
          
          write(hvcFd, &n, 1);
        read(hvcFd, &m, 1);

          // write buffered messages  
          
        

        // for (ActiveConnection& updated : activeConnection) {
        //   if (!updated.active) {
        //     continue;
        //   }
        //   DataPkt *dp = (DataPkt*) malloc(sizeof(DataPkt) + 1500);
        //   memset(dp, 0, sizeof(DataPkt) + 1500);
        //   dp->connId = updated.connectionid;
        //   int len;
        //   while ((len = recv(updated.fd, dp->data, 1500, MSG_DONTWAIT)) >= 0) {
        //     if (len == 0) {
        //       updated.active = 0;
        //       tx->msgType = DISCONNECT;
        //       Disconnect* disconnect = (Disconnect*) tx->message;
        //       disconnect->id = updated.connectionid;
        //       tx->msgId = 0;
        //       ipc_buffer_tx[0] = 1;
        //       write(hvcFd, &n, 1);
        //       read(hvcFd, &m, 1);
        //       break;
        //     }
        //     // printf("recving fr\n");
        //     tx->msgType = DATA;
        //     dp->msgLen = len;
        //     tx->msgId = 0;
        //     memcpy(tx->message, dp, sizeof(DataPkt) + 1500);

        //     m = 1; 
        //     write(hvcFd, &n, 1);
        //     read(hvcFd, &m, 1);
            

        //   }
        //   free(dp);
        //   // perror("test");  
        // }
    };
    return 0;
}

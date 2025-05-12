#include <cstddef>
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
#include <nest_client/nest_client.pb.h>
#include <algorithm>
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
  int port;
} ConnectRequest;
typedef struct {
  int connId;
  size_t msgLen;
  char data[];
} DataPkt;
typedef struct {
  int id;
} Disconnect;
typedef struct {
  int id;
  int error;
} ConnectResponse;
typedef struct {
  int connectionid; 
  int fd;
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
int handle_connection(int port, int* id, int* error) {
  sockaddr_in ip;
  inet_pton(AF_INET, "127.0.0.1", &ip.sin_addr);
  ip.sin_port = htons(port);
  memset(ip.sin_zero, 0,sizeof(ip.sin_zero));
  ip.sin_family = AF_INET;
  if ((*id = findFirstInactiveConnection()) >= 0) {
    // already set
  }else {
  *id = activeConnection.size();
  activeConnection.emplace_back();

  }
  // activeConnection[id] = (ActiveConnection*) malloc(sizeof(ActiveConnection));
  // std::unique_ptr up = std::make_unique<ActiveConnection>();
  ActiveConnection& up = activeConnection.at(*id);
  up.connectionid = *id;

  printf("up connection id:  %d\r\n", up.connectionid);
  up.fd = socket(AF_INET, SOCK_STREAM, 0);
  int s = up.fd;
  up.active = true;
  if (connect(s, (sockaddr*)&ip, sizeof(sockaddr_in)) < 0) {
    printf("connect for a message (%d) failed\n", port);
    *error = errno;
    activeConnection.pop_back();
    return -1;
  };
  
  // activeConnection.push_back(std::move(up));

}
void handle_protocol(Protocol& pr, ProtocolResponse* response) {
  
  if (pr.type() == Type::READDIR) {
    ReaddirRequest r = pr.readdirrequest();
    response->Clear();
    int d = r.dirid();
    if (d >= dirStreams.size()) {
      Error* err = response->mutable_error();
      err->set_error("Dir stream out of bounds\n");
      return;
    }
    if (!dirStreams.at(d).dent) {
      Error* err = response->mutable_error();
      err->set_error("Dir stream expired\n");
      return;
    }
    DirectoryStream& stream =  dirStreams.at(d);
    DIR* dir = stream.dent;
    dev_t dm = 0;
    sizeof(dm);
  }
}
int inotify_poll_loop() {

}

const size_t kChunkSize = 1500;
int main(int argc, char const *argv[])
{ 

    ipc_buffer_rx = (char*) mmap(NULL, 65536, PROT_READ|PROT_WRITE, MAP_SHARED|MAP_ANONYMOUS, -1, 0);

    ipc_buffer_tx = (char*) mmap(NULL, 65536, PROT_READ|PROT_WRITE, MAP_SHARED|MAP_ANONYMOUS, -1, 0);

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
    while (true) {
        std::vector<ActiveConnection> connToUpdate;
        
        ProtocolWrapper* rx = (ProtocolWrapper*) (ipc_buffer_rx + 1);

        ProtocolWrapper* tx = (ProtocolWrapper*) (ipc_buffer_tx + 1); 
        if (*ipc_buffer_rx == 1) {
          int error = 0;
         
          memset(tx->message, 0, 2048);
          tx->msgId = rx->msgId;
          tx->msgType = RESPONSE;
          *ipc_buffer_tx = 0;
          if (rx->msgType == PROTOBUF) {
            Protocol p;
            Protobuf* pr = (Protobuf*) rx->message;
            p.ParseFromArray(pr->message, pr->msgLength);
            ProtocolResponse resp;
            resp.Clear();
            handle_protocol(p, &resp);
            std::string data = resp.SerializeAsString();
            Protobuf* response = (Protobuf*) tx->message;
            response->msgLength = kChunkSize;
            size_t l = data.size();
            size_t off = 0;

            while (l >= 0) {
              size_t to_write = std::min(l, (size_t)kChunkSize);
              memcpy(response->message, data.c_str() + off, data.size());
              l -= to_write;
              off += to_write;
              *ipc_buffer_tx = 1;
              while (*ipc_buffer_tx == 1);
            }

          }
          if (rx->msgType == CONNECT) {
            ConnectRequest* cr = (ConnectRequest*) rx->message;
            ConnectResponse* cresp = new ConnectResponse();
            cresp->id = -1;
            cresp->error = 0;
            int result = handle_connection(cr->port,&cresp->id, &cresp->error);
            
            memcpy(tx->message, cresp, sizeof(ConnectResponse));
            delete cresp;
          }
          if (rx->msgType == DISCONNECT) {
            printf("Disconnected\n");

            Disconnect* d = (Disconnect*) rx->message;
            while (true){
            if (d->id >= activeConnection.size()) {
              // handle error later
              break;
            }
            ActiveConnection& ac = activeConnection.at(d->id);
            ac.active = false;
            close(ac.fd);
            break;
            }
          }
          if (rx->msgType == DATA) {
            DataPkt* d = (DataPkt*) rx->message;
            uint32_t id = d->connId;
            while (1) {
            if (id >= activeConnection.size()) {
              // handle error later
              break;
            }else {
              ActiveConnection& ac = activeConnection.at(id);
              if (!ac.active) {
                break;
              }else {
                send(ac.fd, d->data, d->msgLen, 0);
              }
            }
            break;
            }
            
          }
          *ipc_buffer_rx = 0;
          
          
          ipc_buffer_tx[0] = 1;
          while (ipc_buffer_tx[0] == 1); // Wait for process
          // write buffered messages  
          
        }

        for (ActiveConnection& updated : activeConnection) {
          if (!updated.active) {
            continue;
          }
          DataPkt *dp = (DataPkt*) malloc(sizeof(DataPkt) + 1500);
          memset(dp, 0, sizeof(DataPkt) + 1500);
          dp->connId = updated.connectionid;
          int len;
          while ((len = recv(updated.fd, dp->data, 1500, MSG_DONTWAIT)) >= 0) {
            if (len == 0) {
              updated.active = 0;
              tx->msgType = DISCONNECT;
              Disconnect* disconnect = (Disconnect*) tx->message;
              disconnect->id = updated.connectionid;
              tx->msgId = 0;
              ipc_buffer_tx[0] = 1;
              while (ipc_buffer_tx[0] == 1); // wait for ack 
              break;
            }
            // printf("recving fr\n");
            tx->msgType = DATA;
            dp->msgLen = len;
            tx->msgId = 0;
            memcpy(tx->message, dp, sizeof(DataPkt) + 1500);

            ipc_buffer_tx[0] = 1; // let client process
            while (ipc_buffer_tx[0] == 1); // Wait for process

          }
          free(dp);
          // perror("test");  
        }
    };
    return 0;
}

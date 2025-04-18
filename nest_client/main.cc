#include <cstdio>
#include <stdint.h>
#include <unistd.h>
#include <sys/fcntl.h>
#include <string.h>
#include <stdlib.h>
#include <sys/socket.h>
typedef struct {
    uint64_t pfn : 55;
    unsigned int soft_dirty : 1;
    unsigned int file_page : 1;
    unsigned int swapped : 1;
    unsigned int present : 1;
} PagemapEntry;
typedef struct {
  uint32_t msgType;
  char message[];
} Protocol;
typedef struct {

} ClientResponse;
typedef struct {
  size_t error_len;
  const char error[];
} ClientError;

static char* ipc_buffer_rx;
static char* ipc_buffer_tx;
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
int server_sock_loop() {
  int sock = socket(AF_UNIX, SOCK_STREAM, 0);
  const char* pathname = "/run/nest.sock";

}
int send_usrmsg() {

}
int main(int argc, char const *argv[])
{
    const char* mp = basename(argv[0]);
    if (!strcmp(mp, "editor")) {

    }
    ipc_buffer_rx = (char*) calloc(1, 2048);
    ipc_buffer_tx = (char*) calloc(1, 2048);
    printf("%p\n", ipc_buffer_rx);
    uintptr_t physaddr = -1;
    uintptr_t physaddr_tx = -1;
    if (virt_to_phys_user(&physaddr, getpid(), (uintptr_t) ipc_buffer_rx)) {
        perror("Couldn't obtain physical address.");
        return 0;
    };
    if (virt_to_phys_user(&physaddr_tx, getpid(), (uintptr_t) ipc_buffer_rx)) {
      perror("Couldn't obtain physical address.");
      return 0;
    };
    printf("ptr%lu %lu\n", physaddr, physaddr_tx);
    while (true) {
        if (*ipc_buffer_rx == 1) {
          printf("hello world\n");
          *ipc_buffer_rx = 0;
          

          ipc_buffer_tx[0] = 1;

        }
    };
    return 0;
}

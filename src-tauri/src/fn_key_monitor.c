#include <CoreFoundation/CoreFoundation.h>
#include <IOKit/hid/IOHIDManager.h>

// Apple vendor top case usage for the Fn key.
#define HID_PAGE_APPLE_VENDOR_TOP_CASE 0xFF00
#define HID_USAGE_APPLE_TOP_CASE_FN 0x0003

extern void vwisper_fn_key_update(int is_down);

static int is_fn_usage(uint32_t usage_page, uint32_t usage) {
    return (usage_page == HID_PAGE_APPLE_VENDOR_TOP_CASE && usage == HID_USAGE_APPLE_TOP_CASE_FN) ||
           (usage_page == 0xFF && usage == HID_USAGE_APPLE_TOP_CASE_FN);
}

static void handle_input(void *context, IOReturn result, void *sender, IOHIDValueRef value) {
    (void)context;
    (void)result;
    (void)sender;

    IOHIDElementRef element = IOHIDValueGetElement(value);
    uint32_t usage_page = IOHIDElementGetUsagePage(element);
    uint32_t usage = IOHIDElementGetUsage(element);

    if (is_fn_usage(usage_page, usage)) {
        CFIndex pressed = IOHIDValueGetIntegerValue(value);
        vwisper_fn_key_update(pressed != 0);
    }
}

int vwisper_start_fn_key_monitor(void) {
    IOHIDManagerRef manager = IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone);
    if (!manager) {
        return -1;
    }

    IOHIDManagerSetDeviceMatching(manager, NULL);
    IOHIDManagerRegisterInputValueCallback(manager, handle_input, NULL);
    IOHIDManagerScheduleWithRunLoop(manager, CFRunLoopGetCurrent(), kCFRunLoopCommonModes);

    IOReturn open_result = IOHIDManagerOpen(manager, kIOHIDOptionsTypeNone);
    if (open_result != kIOReturnSuccess) {
        CFRelease(manager);
        return (int)open_result;
    }

    CFRunLoopRun();
    CFRelease(manager);
    return 0;
}

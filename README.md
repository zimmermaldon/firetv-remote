# Fire TV Remote

A small, responsive web remote for controlling an Amazon Fire TV Stick over your local network. The Node.js server invokes Android Debug Bridge (ADB) on the machine hosting the app; the browser sends button presses to that server, and the server sends them to the TV.

> **Local-network app:** this project is designed for private use on a trusted LAN. Do not expose its server or ADB debugging to the public internet.

## Requirements

### Server machine

- Node.js **18 or newer** (npm is included with Node.js).
- Android SDK Platform-Tools, including the `adb` command, installed and available on `PATH`.
- Network access to the Fire TV Stick. The server and TV should be on the same Wi-Fi/LAN, with device isolation disabled.

### Fire TV Stick

- A supported Fire TV device with **ADB Debugging** enabled.
- Its LAN IP address. The default ADB TCP port is usually `5555`.
- The TV must be awake and accept the ADB authorization prompt the first time it connects.

### Browser

A current browser with JavaScript enabled. Open the page from the server machine, or from another device that can access the server over the LAN.

## Install ADB (if needed)

Install Android SDK Platform-Tools using the method appropriate for your server OS, then verify that `adb` is on your `PATH`:

```sh
adb version
```

Examples:

- **macOS with Homebrew:** `brew install android-platform-tools`
- **Debian/Ubuntu:** `sudo apt install adb`
- **Windows:** install Android SDK Platform-Tools and add its `platform-tools` directory to `PATH`; reopen the terminal after changing `PATH`.

## Setup and run

1. **Enable ADB on the TV.** On Fire TV, open **Settings → My Fire TV → Developer Options → ADB Debugging** and turn it on. If Developer Options is hidden, open **Settings → My Fire TV → About**, highlight the device name, and press the select button repeatedly until developer options are enabled. Menu wording can vary by Fire TV model/software version.
2. **Find the TV's IP address.** Open **Settings → My Fire TV → About → Network**. For example, it may look like `192.168.1.25`.
3. **Install and verify prerequisites** on the computer that will run this app: `node --version`, `npm --version`, and `adb version`.
4. **Start the server** from the project directory:

   ```sh
   npm start
   ```

   The server listens on port `3000` and binds to `0.0.0.0` so other devices on the LAN can reach it.
5. **Open the remote.** On the server machine, visit <http://localhost:3000>. To use a phone on the same LAN, visit `http://<server-ip>:3000` (for example `http://192.168.1.10:3000`). Allow inbound connections to port 3000 in the server's firewall only on a trusted private network.
6. Enter the Fire TV address with the ADB port, such as `192.168.1.25:5555`, then tap **Connect**. If prompted, approve the debugging authorization on the TV. The connection indicator should show the connected device.

Keep the terminal running while using the remote. Stop the server with **Ctrl+C**.

## Controls

- D-pad and **OK**: navigate and select.
- **Back**, **Home**, and **Menu**.
- Playback: rewind, play/pause, and fast-forward.
- Volume up/down and mute.
- Text field: send text to the currently focused TV field. Some apps or input fields may not accept ADB text input.
- Keyboard: arrow keys, Enter, Escape, Backspace, and Home when the page itself is focused.

## Configuration

- `PORT` changes the web server port (default `3000`):

  ```sh
  PORT=3001 npm start
  ```

- `FIRETV_DEVICE` sets an address to auto-connect on server startup (for example `192.168.1.25:5555`):

  ```sh
  FIRETV_DEVICE=192.168.1.25:5555 npm start
  ```

  On Windows PowerShell, use `$env:FIRETV_DEVICE="192.168.1.25:5555"; npm start`. The page still has a Connect/Disconnect control.

The project has no npm package dependencies; `npm start` runs the included Node.js server directly.

## Troubleshooting

- **“ADB is not installed or not available”:** install Platform-Tools, verify `adb version`, and make sure the server process inherits the updated `PATH`.
- **Connection times out or is refused:** confirm the TV IP address, that TV and server are on the same network, ADB Debugging is enabled, and the TV is awake. Guest Wi-Fi, VPNs, and router client isolation can prevent device-to-device connections.
- **Unauthorized device:** accept the ADB prompt on the TV. If necessary, toggle ADB Debugging off and back on, then reconnect.
- **Works on the server but not on the phone:** use the server's LAN IP rather than `localhost`, and check that the private-network firewall allows the configured web port.
- **Buttons stop working:** check the connected indicator and TV network; reconnect if needed. Avoid changing the TV's IP address while connected.

## Security notes

ADB can control the TV without further authentication after authorization. Only connect from a trusted network, approve debugging only for machines you trust, and turn off ADB Debugging when finished if you do not need it. The included server has no user login or TLS and is not intended to be internet-facing. Do not port-forward either the web server or ADB port.

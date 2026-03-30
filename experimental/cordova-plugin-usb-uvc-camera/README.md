# Cordova USB UVC Camera Plugin (Experimental)

Questo prototipo nasce per il caso del totem dove:

- la webcam Logitech e' visibile via `UsbManager`
- ma non compare in `CameraManager.getCameraIdList()`
- quindi il backend `Camera2` non basta

## Stato attuale

Il plugin e' uno scaffold separato dal plugin `Camera2` attuale.

Gia' presenti:

- manifest Cordova separato
- bridge JS compatibile con il flusso esistente
- diagnostica `listUsbDevices()`
- `device_filter.xml` UVC
- piano operativo in `IMPLEMENTATION_PLAN.md`
- validazione della dipendenza candidata in `PHASE1_VALIDATION.md`
- prima apertura UVC reale con preview `TextureView` nascosta 1x1
- selezione Logitech/UVC via `UsbManager` e `MultiCameraClient`
- `takePhoto()` con salvataggio in storage app-specifico

Ancora da implementare:

- validazione runtime sul totem della preview nascosta
- hardening del flow `recoverCamera()`
- mapping di focus/exposure/brightness sul backend UVC scelto
- bridge applicativo definitivo e test lunghi 24/7

## Obiettivo tecnico

Il plugin finale dovra':

1. Aprire la Logitech direttamente dal bus USB
2. Non dipendere da `CameraManager`
3. Supportare il flusso kiosk:
   - open all'avvio
   - profilo stabile di focus/exposure
   - scatto foto
   - recovery senza reboot del totem

## API target

- `navigator.usbUvcCamera.open(options, success, error)`
- `navigator.usbUvcCamera.takePhoto(success, error)`
- `navigator.usbUvcCamera.recoverCamera(success, error)`
- `navigator.usbUvcCamera.applyStableCameraProfile(options, success, error)`
- `navigator.usbUvcCamera.listUsbDevices(success, error)`

## Nota pratica

Questo scaffold non sostituisce ancora il plugin attuale. Adesso e' entrato nella Phase 2: c'e' un primo lifecycle `open/close/takePhoto`, ma va ancora validato sul totem prima di poterlo considerare affidabile.

## File chiave

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- [PHASE1_VALIDATION.md](./PHASE1_VALIDATION.md)
- [src/android/UsbUvcCamera.java](./src/android/UsbUvcCamera.java)
- [www/usbUvcCamera.js](./www/usbUvcCamera.js)

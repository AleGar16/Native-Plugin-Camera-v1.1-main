# Cordova USB External Camera Plugin

Un plugin Cordova per accedere a webcam USB-UVC esterne su dispositivi Android tramite connessione OTG.

## Caratteristiche

- Accesso a webcam USB-UVC esterne connesse via OTG
- Implementazione Camera2 API (Android 9+)
- Anteprima in tempo reale con frame codificati in base64
- Cattura foto con salvataggio su file
- Risoluzione e frame rate configurabili
- Gestione corretta dei permessi

## Requisiti

- Android 9+ (API level 28+)
- Supporto USB OTG
- Webcam USB compatibile UVC
- Cordova 9.0.0+
- cordova-android 9.0.0+

## Installazione

```bash
cordova plugin add cordova-plugin-usb-external-camera
```

Oppure installa da percorso locale:
```bash
cordova plugin add /path/to/cordova-plugin-usb-external-camera
```

## Utilizzo

### Esempio Base (Ionic/Angular)

```typescript
import { Component, ElementRef, ViewChild } from '@angular/core';

declare var navigator: any;

@Component({
  selector: 'app-camera',
  template: `
    <div>
      <img #preview style="width: 100%; height: auto;" />
      <button (click)="startCamera()">Avvia Camera</button>
      <button (click)="stopCamera()">Ferma Camera</button>
      <button (click)="takePhoto()">Scatta Foto</button>
    </div>
  `
})
export class CameraPage {
  @ViewChild('preview') preview!: ElementRef<HTMLImageElement>;
  
  startCamera() {
    navigator.usbCamera.open(
      { width: 1280, height: 720, fps: 10, previewFrames: false },
      (frame: string) => {
        this.preview.nativeElement.src = 'data:image/jpeg;base64,' + frame;
      },
      (error: string) => {
        console.error('Errore camera:', error);
      }
    );
  }
  
  stopCamera() {
    navigator.usbCamera.stopPreview(
      () => console.log('Anteprima fermata'),
      (error: string) => console.error('Errore stop:', error)
    );
  }
  
  takePhoto() {
    navigator.usbCamera.takePhoto(
      (filePath: string) => {
        console.log('Foto salvata in:', filePath);
      },
      (error: string) => {
        console.error('Errore foto:', error);
      }
    );
  }
  
  ngOnDestroy() {
    navigator.usbCamera.close();
  }
}
```

### Esempio JavaScript

```javascript
// Avvia camera con watchdog di recovery per uso kiosk/totem
navigator.usbCamera.openWithRecovery(
  {
    width: 1280,
    height: 720,
    fps: 10,
    previewFrames: false,
    jpegQuality: 60,
    recoverDelayMs: 2500,
    takePhotoRetryDelayMs: 1500,
    maxPhotoAttempts: 2
  },
  function(frame) {
    // Se previewFrames e' false, qui normalmente non arrivano frame continui
  },
  function(error) {
    console.error('Errore camera:', error);
  }
);

// Scatta una foto con retry + recovery automatica
navigator.usbCamera.takePhotoWithRecovery(
  function(filePath) {
    console.log('Foto salvata in:', filePath);
  },
  function(error) {
    console.error('Errore foto:', error);
  }
);

// Ferma anteprima
navigator.usbCamera.stopPreview(
  function() {
    console.log('Anteprima fermata');
  },
  function(error) {
    console.error('Errore fermata anteprima:', error);
  }
);

// Chiudi camera
navigator.usbCamera.close(
  function() {
    console.log('Camera chiusa');
  },
  function(error) {
    console.error('Errore chiusura camera:', error);
  }
);
```

## Riferimento API

### navigator.usbCamera.open(options, onFrame, onError)

Apre la camera USB esterna e avvia l'anteprima.

**Parametri:**
- `options` (Object): Configurazione camera
  - `width` (number): Larghezza anteprima (default: 1280)
  - `height` (number): Altezza anteprima (default: 720)
  - `fps` (number): Frame rate (default: 30)
  - `previewFrames` (boolean): Se `false`, tiene la camera aperta senza inviare frame base64 continui alla WebView (default: `true`)
  - `jpegQuality` (number): Qualita' JPEG dei frame preview, utile per ridurre carico CPU/memoria (default: 70)
- `onFrame` (Function): Callback per ogni frame (riceve stringa base64)
- `onError` (Function): Callback errore

### navigator.usbCamera.openWithRecovery(options, onFrame, onError)

Versione consigliata per totem/kiosk. Salva la configurazione corrente e, in caso di errore camera, prova automaticamente `recoverCamera()` seguito da `open()`.

**Opzioni aggiuntive:**
- `recoverDelayMs` (number): attesa prima del tentativo di recover/reopen (default: 2500)
- `takePhotoRetryDelayMs` (number): attesa prima di ritentare uno scatto dopo recovery (default: 1500)
- `maxPhotoAttempts` (number): numero massimo di tentativi per `takePhotoWithRecovery` (default: 2)

### navigator.usbCamera.stopPreview(callback, errorCallback)

Ferma l'anteprima camera senza chiudere la camera.

### navigator.usbCamera.takePhoto(callback, errorCallback)

Cattura una foto e la salva nella memoria del dispositivo.

**Ritorna:** Percorso file della foto salvata

### navigator.usbCamera.takePhotoWithRecovery(callback, errorCallback)

Esegue lo scatto con retry automatico. Se il primo tentativo fallisce, prova `recoverCamera()` e ritenta fino a `maxPhotoAttempts`.

### navigator.usbCamera.close(callback, errorCallback)

Chiude la camera e rilascia tutte le risorse.

## Risoluzione Problemi

### Camera Non Trovata
- Assicurati che la webcam USB sia compatibile UVC
- Controlla la connessione del cavo OTG
- Verifica che il dispositivo supporti la modalità USB host
- Prova porte/cavi USB diversi

### Problemi di Permessi
- Concedi i permessi camera nelle impostazioni app
- Abilita i permessi storage per la cattura foto
- Controlla le impostazioni debug USB

### Problemi di Performance
- Riduci risoluzione/frame rate per migliori prestazioni
- Assicurati alimentazione USB adeguata
- Chiudi altre applicazioni camera

### Webcam Supportate
La maggior parte delle webcam compatibili UVC dovrebbero funzionare, incluse:
- Logitech C920, C922, C930e
- Serie Microsoft LifeCam
- Webcam UVC generiche

### Compatibilità Android
- Minimo Android 9 (API 28)
- Supporto USB OTG richiesto
- Alcuni dispositivi potrebbero avere limitazioni hardware

## Licenza

Licenza MIT - vedi file LICENSE per dettagli.

## Contributi

Pull request benvenute! Assicurati che il codice segua lo stile esistente e includa test.

## Supporto

Per problemi e domande, utilizza il tracker GitHub issues.

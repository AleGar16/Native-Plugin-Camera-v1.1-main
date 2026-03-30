var exec = require('cordova/exec');

var watchdogState = {
    active: false,
    options: null,
    onFrame: null,
    onError: null,
    recoverDelayMs: 2500,
    takePhotoRetryDelayMs: 1500,
    maxPhotoAttempts: 2,
    recoverTimer: null,
    recovering: false
};

function clearRecoverTimer() {
    if (watchdogState.recoverTimer) {
        clearTimeout(watchdogState.recoverTimer);
        watchdogState.recoverTimer = null;
    }
}

function cloneOptions(options) {
    var source = options || {};
    var copy = {};
    Object.keys(source).forEach(function(key) {
        copy[key] = source[key];
    });
    return copy;
}

function scheduleRecovery(reason) {
    if (!watchdogState.active || watchdogState.recovering) {
        return;
    }

    watchdogState.recovering = true;
    clearRecoverTimer();

    watchdogState.recoverTimer = setTimeout(function() {
        exec(function() {
            var reopenOptions = cloneOptions(watchdogState.options);
            exec(function(result) {
                watchdogState.recovering = false;
                if (typeof watchdogState.onFrame === 'function' && reopenOptions.previewFrames !== false) {
                    watchdogState.onFrame(result);
                }
            }, function(err) {
                watchdogState.recovering = false;
                if (typeof watchdogState.onError === 'function') {
                    watchdogState.onError({
                        stage: 'reopen',
                        message: err,
                        reason: reason
                    });
                }
                scheduleRecovery('reopen-failed');
            }, 'UsbExternalCamera', 'open', [reopenOptions]);
        }, function(err) {
            watchdogState.recovering = false;
            if (typeof watchdogState.onError === 'function') {
                watchdogState.onError({
                    stage: 'recoverCamera',
                    message: err,
                    reason: reason
                });
            }
            scheduleRecovery('recover-failed');
        }, 'UsbExternalCamera', 'recoverCamera', []);
    }, watchdogState.recoverDelayMs);
}

var UsbCamera = {
    open: function(options, onFrame, onError) {
        options = options || {};
        
        var success = function(result) {
            if (typeof onFrame === 'function') {
                onFrame(result);
            }
        };
        
        var error = function(err) {
            if (typeof onError === 'function') {
                onError(err);
            }
        };
        
        exec(success, error, 'UsbExternalCamera', 'open', [options]);
    },

    openWithRecovery: function(options, onFrame, onError) {
        var kioskOptions = cloneOptions(options);

        watchdogState.active = true;
        watchdogState.options = kioskOptions;
        watchdogState.onFrame = onFrame;
        watchdogState.onError = onError;
        watchdogState.recoverDelayMs = typeof kioskOptions.recoverDelayMs === 'number' ? kioskOptions.recoverDelayMs : 2500;
        watchdogState.takePhotoRetryDelayMs = typeof kioskOptions.takePhotoRetryDelayMs === 'number' ? kioskOptions.takePhotoRetryDelayMs : 1500;
        watchdogState.maxPhotoAttempts = typeof kioskOptions.maxPhotoAttempts === 'number' ? kioskOptions.maxPhotoAttempts : 2;
        watchdogState.recovering = false;
        clearRecoverTimer();

        this.open(kioskOptions, onFrame, function(err) {
            if (typeof onError === 'function') {
                onError({
                    stage: 'open',
                    message: err
                });
            }
            scheduleRecovery('open-error');
        });
    },

    stopWatchdog: function() {
        watchdogState.active = false;
        watchdogState.recovering = false;
        clearRecoverTimer();
    },
    
    stopPreview: function(callback, errorCallback) {
        exec(callback, errorCallback, 'UsbExternalCamera', 'stopPreview', []);
    },
    
    takePhoto: function(callback, errorCallback) {
        exec(callback, errorCallback, 'UsbExternalCamera', 'takePhoto', []);
    },

    takePhotoWithRecovery: function(callback, errorCallback) {
        var attempts = 0;
        var maxAttempts = Math.max(1, watchdogState.maxPhotoAttempts || 2);

        function tryTakePhoto() {
            attempts += 1;
            exec(function(filePath) {
                if (typeof callback === 'function') {
                    callback(filePath);
                }
            }, function(err) {
                if (attempts >= maxAttempts) {
                    if (typeof errorCallback === 'function') {
                        errorCallback({
                            stage: 'takePhoto',
                            message: err,
                            attempts: attempts
                        });
                    }
                    scheduleRecovery('takePhoto-failed');
                    return;
                }

                exec(function() {
                    setTimeout(tryTakePhoto, watchdogState.takePhotoRetryDelayMs);
                }, function(recoverErr) {
                    if (typeof errorCallback === 'function') {
                        errorCallback({
                            stage: 'recoverBeforeRetry',
                            message: recoverErr,
                            attempts: attempts
                        });
                    }
                    scheduleRecovery('recover-before-photo-retry-failed');
                }, 'UsbExternalCamera', 'recoverCamera', []);
            }, 'UsbExternalCamera', 'takePhoto', []);
        }

        tryTakePhoto();
    },
    
    close: function(callback, errorCallback) {
        this.stopWatchdog();
        exec(callback, errorCallback, 'UsbExternalCamera', 'close', []);
    },
    
    listCameras: function (callback, errorCallback) {
        exec(callback, errorCallback, 'UsbExternalCamera', 'listCameras', []);
    },

    listUsbDevices: function (callback, errorCallback) {
        exec(callback, errorCallback, 'UsbExternalCamera', 'listUsbDevices', []);
    },
    
    disableAutofocus: function (callback, errorCallback) {
        exec(callback, errorCallback, 'UsbExternalCamera', 'disableAutofocus', []);
    },
    
    initSimple: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'initSimple', []);
    },
    
    triggerAutofocus: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'triggerAutofocus', []);
    },
    
    optimizeAutofocusForUsb: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'optimizeAutofocusForUsb', []);
    },
    
    setFocusDistance: function(distance, successCallback, errorCallback) {
        if (typeof distance !== 'number' || distance < 0 || distance > 1) {
            if (typeof errorCallback === 'function') {
                errorCallback('Focus distance must be a number between 0.0 (infinity) and 1.0 (minimum distance)');
            }
            return;
        }
        
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'setFocusDistance', [distance]);
    },
    
    setUvcAutoFocus: function(enable, successCallback, errorCallback) {
        if (typeof enable !== 'boolean') {
            if (typeof errorCallback === 'function') {
                errorCallback('Enable parameter must be a boolean (true or false)');
            }
            return;
        }
        
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'setUvcAutoFocus', [enable]);
    },
    
    setUvcFocusAbsolute: function(value, successCallback, errorCallback) {
        if (typeof value !== 'number' || value < 0 || value > 1) {
            if (typeof errorCallback === 'function') {
                errorCallback('Focus value must be a number between 0.0 and 1.0');
            }
            return;
        }
        
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'setUvcFocusAbsolute', [value]);
    },
    
    setUvcAutoExposure: function(enable, successCallback, errorCallback) {
        if (typeof enable !== 'boolean') {
            if (typeof errorCallback === 'function') {
                errorCallback('Enable parameter must be a boolean (true or false)');
            }
            return;
        }
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'setUvcAutoExposure', [enable]);
    },
    
    setUvcExposureAbsolute: function(value, successCallback, errorCallback) {
        if (typeof value !== 'number' || value < 0 || value > 1) {
            if (typeof errorCallback === 'function') {
                errorCallback('Exposure value must be a number between 0.0 and 1.0');
            }
            return;
        }
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'setUvcExposureAbsolute', [value]);
    },
    
    debugUvcExposure: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'debugUvcExposure', []);
    },
    
    setUvcBrightness: function(value, successCallback, errorCallback) {
        if (typeof value !== 'number' || value < 0 || value > 1) {
            if (typeof errorCallback === 'function') {
                errorCallback('Brightness value must be a number between 0.0 and 1.0');
            }
            return;
        }
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'setUvcBrightness', [value]);
    },
    
    debugUvcBrightness: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'debugUvcBrightness', []);
    },
    
    debugUvcControls: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'debugUvcControls', []);
    },
    
    recoverCamera: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'UsbExternalCamera', 'recoverCamera', []);
    }
};

module.exports = UsbCamera;

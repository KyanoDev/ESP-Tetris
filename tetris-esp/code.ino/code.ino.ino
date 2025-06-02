#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Pin Definitions
#define LED_PIN 22
#define JOYSTICK_X_PIN 34 // Analog input for X-axis
#define JOYSTICK_Y_PIN 35 // Analog input for Y-axis
#define BUTTON_A_PIN 13   // Push down (A) and pair mode button
#define BUTTON_B_PIN 12   // Rotation (B) button

// Calibration for joystick (adjust as needed)
const int x_center = 512;
const int y_center = 512;
const int deadzone = 30;

// Bluetooth connection state
bool connectedToBT = false;
bool pairingMode = false;

// LED Blinking Timers
unsigned long previousMillis = 0;
const long blinkIntervalConnected = 1000; // Slow blink when waiting
const long blinkIntervalPairing = 250;    // Fast blink in pairing mode

// Button States and Timing
bool buttonAState, lastButtonAState = HIGH;
bool buttonBState, lastButtonBState = HIGH;
unsigned long buttonAPressStartTime = 0;

// Joystick Command Tracking
String lastJoystickCommand = "";

// UUIDs - Use custom UUIDs for production
static BLEUUID service_uuid("F0E1D2C3-B4A5-4CD8-A9B7-C6D5E4F3A2B1");
static BLEUUID characteristic_uuid("12AB34CD-56EF-4789-B3C2-D1E0F9A8BCD0");

// Global variables
BLEServer* pServer = NULL;
BLEService* pService = NULL;
BLECharacteristic* pCharacteristic = NULL;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) override {
        connectedToBT = true;
        digitalWrite(LED_PIN, HIGH); // Turn LED solid when connected
    }
    
    void onDisconnect(BLEServer* pServer) override {
        connectedToBT = false;
        pairingMode = false; // Exit pairing mode if disconnected
        
        // Restart advertising to allow reconnection
        BLEDevice::startAdvertising();
        
        previousMillis = millis(); // Reset blinking timer
    }
};

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_A_PIN, INPUT_PULLUP);
  pinMode(BUTTON_B_PIN, INPUT_PULLUP);
  
  // Start up blinking LED (waiting for connection)
  digitalWrite(LED_PIN, LOW);
  
  // Create BLE server and service
  BLEDevice::init("TetrisController");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  pService = pServer->createService(service_uuid);
  pCharacteristic = pService->createCharacteristic(
    characteristic_uuid,
    BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ // <-- Add READ
  );
  pCharacteristic->setValue("IDLE");
  
  // Add descriptor for CCC (Client Characteristic Configuration)
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();
  
  // Start advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->setAppearance(0x03C8);

 BLEDevice::startAdvertising();
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Handle button A press for pairing mode
  buttonAState = digitalRead(BUTTON_A_PIN);
  
  if (buttonAState == LOW && lastButtonAState == HIGH) {
    buttonAPressStartTime = currentMillis;
  }
  
  if (!connectedToBT && !pairingMode) {
    // Check for long press to enter pairing mode
    if (buttonAState == LOW && (currentMillis - buttonAPressStartTime > 5000)) {
      pairingMode = true;
      
      previousMillis = currentMillis; // Reset blinking timer
      
      // Restart advertising in case we're disconnected
      BLEDevice::startAdvertising();
    }
  }
  
  lastButtonAState = buttonAState;
  
  // Handle LED blinking based on state
  if (!connectedToBT) {
    unsigned long blinkInterval = pairingMode ? blinkIntervalPairing : blinkIntervalConnected;
    
    if (currentMillis - previousMillis >= blinkInterval) {
      previousMillis = currentMillis;
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    }
  }
  
  // If not connected, return early to save processing power
  if (!connectedToBT || pCharacteristic == NULL) return;
  
  // Read joystick values with deadzone detection
  int xVal = analogRead(JOYSTICK_X_PIN);
  int yVal = analogRead(JOYSTICK_Y_PIN);
  
  String newCommand = "";
  
  // Determine command based on joystick position
  if (xVal < x_center - deadzone) {
    newCommand = "LEFT";
  } else if (xVal > x_center + deadzone) {
    newCommand = "RIGHT";
  } else if (yVal < y_center - deadzone) {
    newCommand = "DOWN";
  }
  
  // Send command over BLE if different from last and client is connected
  if (newCommand != "" && connectedToBT) {
    if (connectedToBT && newCommand != lastJoystickCommand) {
      pCharacteristic->setValue(newCommand.c_str());
      pCharacteristic->notify();
      
      lastJoystickCommand = newCommand;
    }
    
    // Reset command when joystick returns to center
  } else if (newCommand == "" && lastJoystickCommand.length() > 0) {
    lastJoystickCommand = "";
  }
  
  // Handle button A (push down)
  buttonAState = digitalRead(BUTTON_A_PIN);
  if (buttonAState == LOW && !pairingMode) {
    pCharacteristic->setValue("A");
    pCharacteristic->notify();
    
    delay(200); // Simple debounce
  }
  
  // Handle button B (rotation)
  buttonBState = digitalRead(BUTTON_B_PIN);
  if (buttonBState == LOW) {
    pCharacteristic->setValue("B");
    pCharacteristic->notify();
    
    delay(200); // Simple debounce
  }
}


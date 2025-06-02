#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

// BLE Service and Characteristic UUIDs
#define SERVICE_UUID        "e10ae3ca-6474-445b-affa-05ea0c8ef57a"
#define COMMAND_CHAR_UUID   "47c39e7f-43d8-4d16-9b99-77ad1ee4d1c3"
#define STATE_CHAR_UUID     "e4f49389-330b-4e8f-a771-a8056fb6367a"

// Pin definitions based on your diagram
#define JOYSTICK_X_PIN 34
#define JOYSTICK_Y_PIN 35
#define JOYSTICK_BUTTON_PIN 32
#define START_BUTTON_PIN 27
#define DOWN_BUTTON_PIN 25
#define TURN_BUTTON_PIN 26
#define STATUS_LED_PIN 22

// Button debounce
unsigned long lastButtonPress = 0;
const unsigned long debounceDelay = 150;

// Joystick state tracking
bool joystickLeftPressed = false;
bool joystickRightPressed = false;
bool joystickDownPressed = false;

// Button state tracking
bool startButtonPressed = false;
bool downButtonPressed = false;
bool turnButtonPressed = false;
bool joystickButtonPressed = false;

// BLE variables
BLEServer* pServer = NULL;
BLECharacteristic* pCommandCharacteristic = NULL;
BLECharacteristic* pStateCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// LED blink state
unsigned long lastLedBlink = 0;
bool ledState = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("BLE Client Connected");
      digitalWrite(STATUS_LED_PIN, HIGH);
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("BLE Client Disconnected");
      digitalWrite(STATUS_LED_PIN, LOW);
    }
};

void handleBLEMessage(const char* message) {
  StaticJsonDocument<500> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  const char* type = doc["type"];
  
  if (strcmp(type, "gameState") == 0) {
    bool isGameOver = doc["isGameOver"];
    bool isPaused = doc["isPaused"];
    int score = doc["score"];
    int level = doc["level"];
    
    // LED feedback based on game state
    if (isGameOver) {
      blinkStatusLED(3, 200); // 3 fast blinks for game over
    } else if (isPaused) {
      blinkStatusLED(1, 500); // 1 slow blink for pause
    }
    
    Serial.printf("Game State - Score: %d, Level: %d, GameOver: %s, Paused: %s\n", 
                  score, level, isGameOver ? "true" : "false", isPaused ? "true" : "false");
  }
  else if (strcmp(type, "lineCleared") == 0) {
    int linesCleared = doc["lines"];
    blinkStatusLED(linesCleared, 100);
    Serial.printf("Lines cleared: %d\n", linesCleared);
  }
}

class MyCharacteristicCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String value = pCharacteristic->getValue();
      
      if (value.length() > 0) {
        Serial.print("Received from web app: ");
        Serial.println(value.c_str());
        handleBLEMessage(value.c_str());
      }
    }
};

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(JOYSTICK_BUTTON_PIN, INPUT_PULLUP);
  pinMode(START_BUTTON_PIN, INPUT_PULLUP);
  pinMode(DOWN_BUTTON_PIN, INPUT_PULLUP);
  pinMode(TURN_BUTTON_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED_PIN, OUTPUT);
  
  // Initialize status LED (off)
  digitalWrite(STATUS_LED_PIN, LOW);
  
  // Initialize BLE
  BLEDevice::init("ESP32-Tetris-Controller");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create Command Characteristic (for sending commands to web app)
  pCommandCharacteristic = pService->createCharacteristic(
                      COMMAND_CHAR_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE |
                      BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_INDICATE
                    );
  

  // Create State Characteristic (for receiving game state from web app)
  pStateCharacteristic = pService->createCharacteristic(
                      STATE_CHAR_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY
                    );
  pStateCharacteristic->setCallbacks(new MyCharacteristicCallbacks());


  pCommandCharacteristic->addDescriptor(new BLE2902());
  pStateCharacteristic->addDescriptor(new BLE2902());
  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();
  
  Serial.println("ESP32 Tetris BLE Controller initialized");
  Serial.println("Waiting for BLE connection...");
}

void loop() {
  // Handle BLE connection state
  if (!deviceConnected && oldDeviceConnected) {
    delay(200); // Give the bluetooth stack time to get ready
    pServer->startAdvertising(); // Restart advertising
    Serial.println("Start advertising");
    oldDeviceConnected = deviceConnected;
  }
  
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
  // Blink LED when not connected
  if (!deviceConnected) {
    if (millis() - lastLedBlink > 500) {
      ledState = !ledState;
      digitalWrite(STATUS_LED_PIN, ledState);
      lastLedBlink = millis();
    }
  }
  
  
  // Read and process inputs only when connected
  if (deviceConnected) {
    readJoystick();
    readButtons();
  }
  
  delay(50);
}

void readJoystick() {
  int xValue = analogRead(JOYSTICK_X_PIN);
  int yValue = analogRead(JOYSTICK_Y_PIN);
  Serial.println(xValue);
  Serial.println(yValue);

  // Check vertical movement (down)
  if (yValue == 4095) {
    sendGameCommand("softDrop");
    Serial.println("Joystick: Soft Drop");
    delay(250);
    return;
  }

  if (xValue == 0) {
    sendGameCommand("moveLeft");
    Serial.println("Joystick: Move Left");
    delay(250);
    return;
  } 

  if (xValue == 4095) {
    sendGameCommand("moveRight");
    Serial.println("Joystick: Move Right");
    delay(250);
    return;
  }
}

void readButtons() {
  // Read START button (pause/resume)
  bool startButtonState = !digitalRead(START_BUTTON_PIN);
  if (startButtonState && !startButtonPressed && 
      (millis() - lastButtonPress > debounceDelay)) {
    startButtonPressed = true;
    lastButtonPress = millis();
    sendGameCommand("pause");
    Serial.println("Start Button: Pause/Resume");
  } else if (!startButtonState) {
    startButtonPressed = false;
  }
  
  // Read DOWN button (soft drop)
  bool downButtonState = !digitalRead(DOWN_BUTTON_PIN);
  if (downButtonState && !downButtonPressed && 
      (millis() - lastButtonPress > debounceDelay)) {
    downButtonPressed = true;
    lastButtonPress = millis();
    sendGameCommand("softDrop");
    Serial.println("Down Button: Soft Drop");
  } else if (!downButtonState) {
    downButtonPressed = false;
  }
  
  // Read TURN button (rotate)
  bool turnButtonState = !digitalRead(TURN_BUTTON_PIN);
  if (turnButtonState && !turnButtonPressed && 
      (millis() - lastButtonPress > debounceDelay)) {
    turnButtonPressed = true;
    lastButtonPress = millis();
    sendGameCommand("rotate");
    Serial.println("Turn Button: Rotate");
  } else if (!turnButtonState) {
    turnButtonPressed = false;
  }
}

void sendGameCommand(const char* command) {
  if (!deviceConnected) return;
  
  // Create JSON message
  StaticJsonDocument<200> doc;
  doc["type"] = "gameCommand";
  doc["command"] = command;
  doc["timestamp"] = millis();
  
  String message;
  serializeJson(doc, message);
  
  // Send via BLE
  pCommandCharacteristic->setValue(message.c_str());
  pCommandCharacteristic->notify();
  
  Serial.print("Sent: ");
  Serial.println(message);
}



void blinkStatusLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(delayMs);
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(delayMs);
  }
}
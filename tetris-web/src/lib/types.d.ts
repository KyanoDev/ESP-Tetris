declare interface BluetoothDevice {
	gatt: any;
}
declare interface BluetoothRemoteGATTServer {}
declare interface BluetoothRemoteGATTCharacteristic {
	value: any;
	writeValue: any;
}
interface Navigator {
	bluetooth: Bluetooth;
}

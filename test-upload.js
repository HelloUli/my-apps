// Test file to isolate blob creation issues
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import * as FileSystem from 'expo-file-system';

// Test 1: Simple string upload (should work)
export async function testSimpleUpload() {
  try {
    console.log('🧪 Test 1: Simple string upload');
    const storageRef = ref(storage, 'test/simple-string.txt');
    await uploadString(storageRef, 'Hello World', 'raw');
    console.log('✅ Simple string upload successful');
    return true;
  } catch (error) {
    console.error('❌ Simple string upload failed:', error);
    return false;
  }
}

// Test 2: Base64 upload (this is what we're using)
export async function testBase64Upload() {
  try {
    console.log('🧪 Test 2: Base64 upload');
    const testData = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
    const storageRef = ref(storage, 'test/base64-test.txt');
    await uploadString(storageRef, testData, 'base64');
    console.log('✅ Base64 upload successful');
    return true;
  } catch (error) {
    console.error('❌ Base64 upload failed:', error);
    return false;
  }
}

// Test 3: File system read + upload (this is what's failing)
export async function testFileSystemUpload() {
  try {
    console.log('🧪 Test 3: File system read + upload');
    
    // Create a test file first
    const testUri = FileSystem.documentDirectory + 'test-file.txt';
    await FileSystem.writeAsStringAsync(testUri, 'Test content');
    
    // Read as base64
    const base64Data = await FileSystem.readAsStringAsync(testUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('📁 File read successfully, base64 length:', base64Data.length);
    
    // Upload to Firebase
    const storageRef = ref(storage, 'test/file-system-test.txt');
    await uploadString(storageRef, base64Data, 'base64');
    console.log('✅ File system upload successful');
    return true;
  } catch (error) {
    console.error('❌ File system upload failed:', error);
    return false;
  }
}

// Test 4: Check if Firebase SDK is the culprit
export async function testFirebaseSDK() {
  try {
    console.log('🧪 Test 4: Firebase SDK compatibility');
    
    // Try to access Firebase Storage methods
    console.log('📦 Firebase Storage methods available:', {
      ref: typeof ref,
      uploadString: typeof uploadString,
      getDownloadURL: typeof getDownloadURL
    });
    
    // Check if we can create a reference
    const storageRef = ref(storage, 'test/sdk-test.txt');
    console.log('✅ Firebase reference created successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Firebase SDK test failed:', error);
    return false;
  }
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 Starting diagnostic tests...');
  
  const results = {
    simpleUpload: await testSimpleUpload(),
    base64Upload: await testBase64Upload(),
    fileSystemUpload: await testFileSystemUpload(),
    firebaseSDK: await testFirebaseSDK()
  };
  
  console.log('📊 Test Results:', results);
  return results;
} 
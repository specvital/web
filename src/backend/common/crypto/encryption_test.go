package crypto

import (
	"fmt"
	"strings"
	"sync"
	"testing"
)

func TestNewEncryptor(t *testing.T) {
	tests := []struct {
		name    string
		key     string
		wantErr bool
	}{
		{
			name:    "valid 32-byte key",
			key:     "12345678901234567890123456789012",
			wantErr: false,
		},
		{
			name:    "key too short",
			key:     "short",
			wantErr: true,
		},
		{
			name:    "key too long",
			key:     "123456789012345678901234567890123",
			wantErr: true,
		},
		{
			name:    "empty key",
			key:     "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewEncryptor(tt.key)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewEncryptor() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestEncryptor_EncryptDecrypt(t *testing.T) {
	key := "12345678901234567890123456789012"
	enc, err := NewEncryptor(key)
	if err != nil {
		t.Fatalf("NewEncryptor() error = %v", err)
	}

	tests := []struct {
		name      string
		plaintext string
		wantErr   bool
	}{
		{
			name:      "simple text",
			plaintext: "hello world",
			wantErr:   false,
		},
		{
			name:      "oauth token format",
			plaintext: "gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
			wantErr:   false,
		},
		{
			name:      "unicode text",
			plaintext: "안녕하세요 세계",
			wantErr:   false,
		},
		{
			name:      "long text",
			plaintext: strings.Repeat("a", 1000),
			wantErr:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ciphertext, err := enc.Encrypt(tt.plaintext)
			if (err != nil) != tt.wantErr {
				t.Errorf("Encrypt() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr {
				return
			}

			if ciphertext == tt.plaintext {
				t.Error("Encrypt() ciphertext should not equal plaintext")
			}

			decrypted, err := enc.Decrypt(ciphertext)
			if err != nil {
				t.Errorf("Decrypt() error = %v", err)
				return
			}

			if decrypted != tt.plaintext {
				t.Errorf("Decrypt() = %v, want %v", decrypted, tt.plaintext)
			}
		})
	}
}

func TestEncryptor_EncryptEmpty(t *testing.T) {
	key := "12345678901234567890123456789012"
	enc, _ := NewEncryptor(key)

	_, err := enc.Encrypt("")
	if err == nil {
		t.Error("Encrypt() should return error for empty plaintext")
	}
}

func TestEncryptor_DecryptInvalid(t *testing.T) {
	key := "12345678901234567890123456789012"
	enc, _ := NewEncryptor(key)

	tests := []struct {
		name       string
		ciphertext string
	}{
		{name: "empty", ciphertext: ""},
		{name: "invalid base64", ciphertext: "not-base64!@#$"},
		{name: "too short", ciphertext: "YWJj"},
		{name: "tampered", ciphertext: "dGFtcGVyZWRkYXRhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := enc.Decrypt(tt.ciphertext)
			if err == nil {
				t.Error("Decrypt() should return error for invalid ciphertext")
			}
		})
	}
}

func TestEncryptor_UniqueNonce(t *testing.T) {
	key := "12345678901234567890123456789012"
	enc, _ := NewEncryptor(key)

	plaintext := "same text"
	ciphertext1, _ := enc.Encrypt(plaintext)
	ciphertext2, _ := enc.Encrypt(plaintext)

	if ciphertext1 == ciphertext2 {
		t.Error("Encrypt() should produce different ciphertexts for same plaintext (random nonce)")
	}
}

func TestEncryptor_WrongKey(t *testing.T) {
	key1 := "12345678901234567890123456789012"
	key2 := "abcdefghijklmnopqrstuvwxyz123456"

	enc1, _ := NewEncryptor(key1)
	enc2, _ := NewEncryptor(key2)

	plaintext := "secret data"
	ciphertext, _ := enc1.Encrypt(plaintext)

	_, err := enc2.Decrypt(ciphertext)
	if err == nil {
		t.Error("Decrypt() should fail with wrong key")
	}
}

func TestGenerateKey(t *testing.T) {
	key1, err := GenerateKey()
	if err != nil {
		t.Fatalf("GenerateKey() error = %v", err)
	}

	key2, err := GenerateKey()
	if err != nil {
		t.Fatalf("GenerateKey() error = %v", err)
	}

	if key1 == key2 {
		t.Error("GenerateKey() should produce unique keys")
	}

	enc, err := NewEncryptorFromBase64(key1)
	if err != nil {
		t.Errorf("Generated key should work with NewEncryptorFromBase64: %v", err)
	}

	plaintext := "test data"
	ciphertext, err := enc.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("Encrypt() error = %v", err)
	}

	decrypted, err := enc.Decrypt(ciphertext)
	if err != nil {
		t.Fatalf("Decrypt() error = %v", err)
	}

	if decrypted != plaintext {
		t.Errorf("Decrypt() = %v, want %v", decrypted, plaintext)
	}
}

func TestNewEncryptorFromBase64(t *testing.T) {
	tests := []struct {
		name    string
		key     string
		wantErr bool
	}{
		{
			name:    "valid base64 key",
			key:     "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=", // 32 bytes base64 encoded
			wantErr: false,
		},
		{
			name:    "invalid base64",
			key:     "not-valid-base64!@#",
			wantErr: true,
		},
		{
			name:    "valid base64 wrong length",
			key:     "c2hvcnQ=", // "short" base64 encoded
			wantErr: true,
		},
		{
			name:    "empty",
			key:     "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewEncryptorFromBase64(tt.key)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewEncryptorFromBase64() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestEncryptor_Concurrent(t *testing.T) {
	key := "12345678901234567890123456789012"
	enc, err := NewEncryptor(key)
	if err != nil {
		t.Fatalf("NewEncryptor() error = %v", err)
	}

	const goroutines = 10
	const iterations = 100

	var wg sync.WaitGroup
	errCh := make(chan error, goroutines*iterations)

	for i := range goroutines {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := range iterations {
				plaintext := fmt.Sprintf("goroutine-%d-iteration-%d", id, j)

				ciphertext, err := enc.Encrypt(plaintext)
				if err != nil {
					errCh <- fmt.Errorf("Encrypt failed: %w", err)
					return
				}

				decrypted, err := enc.Decrypt(ciphertext)
				if err != nil {
					errCh <- fmt.Errorf("Decrypt failed: %w", err)
					return
				}

				if decrypted != plaintext {
					errCh <- fmt.Errorf("mismatch: got %q, want %q", decrypted, plaintext)
					return
				}
			}
		}(i)
	}

	wg.Wait()
	close(errCh)

	for err := range errCh {
		t.Error(err)
	}
}

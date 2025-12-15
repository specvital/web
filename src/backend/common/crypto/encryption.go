// Package crypto provides NaCl SecretBox encryption for secure token storage.
package crypto

import (
	"crypto/rand"
	"encoding/base64"
	"io"

	"github.com/cockroachdb/errors"
	"golang.org/x/crypto/nacl/secretbox"
)

const (
	KeyLength   = 32
	nonceLength = 24
)

var (
	ErrInvalidKeyLength  = errors.New("encryption key must be 32 bytes")
	ErrDecryptionFailed  = errors.New("decryption failed")
	ErrInvalidCiphertext = errors.New("invalid ciphertext")
	ErrEmptyPlaintext    = errors.New("plaintext cannot be empty")
)

type Encryptor interface {
	Encrypt(plaintext string) (string, error)
	Decrypt(ciphertext string) (string, error)
}

type secretboxEncryptor struct {
	key [KeyLength]byte
}

func NewEncryptor(key string) (Encryptor, error) {
	keyBytes := []byte(key)
	if len(keyBytes) != KeyLength {
		return nil, errors.Wrapf(ErrInvalidKeyLength, "got %d bytes", len(keyBytes))
	}
	return newEncryptorFromBytes(keyBytes), nil
}

func NewEncryptorFromBase64(encodedKey string) (Encryptor, error) {
	keyBytes, err := base64.StdEncoding.DecodeString(encodedKey)
	if err != nil {
		return nil, errors.Wrap(ErrInvalidKeyLength, "invalid base64 encoding")
	}
	if len(keyBytes) != KeyLength {
		return nil, errors.Wrapf(ErrInvalidKeyLength, "decoded key is %d bytes, expected %d", len(keyBytes), KeyLength)
	}
	return newEncryptorFromBytes(keyBytes), nil
}

func newEncryptorFromBytes(keyBytes []byte) Encryptor {
	var key [KeyLength]byte
	copy(key[:], keyBytes)
	return &secretboxEncryptor{key: key}
}

func (e *secretboxEncryptor) Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", ErrEmptyPlaintext
	}

	var nonce [nonceLength]byte
	if _, err := io.ReadFull(rand.Reader, nonce[:]); err != nil {
		return "", errors.Wrap(err, "failed to generate nonce")
	}

	encrypted := secretbox.Seal(nonce[:], []byte(plaintext), &nonce, &e.key)
	return base64.StdEncoding.EncodeToString(encrypted), nil
}

func (e *secretboxEncryptor) Decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", ErrInvalidCiphertext
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", errors.Wrap(ErrInvalidCiphertext, "base64 decode failed")
	}

	if len(data) < nonceLength+secretbox.Overhead {
		return "", errors.Wrap(ErrInvalidCiphertext, "ciphertext too short")
	}

	var nonce [nonceLength]byte
	copy(nonce[:], data[:nonceLength])

	decrypted, ok := secretbox.Open(nil, data[nonceLength:], &nonce, &e.key)
	if !ok {
		return "", ErrDecryptionFailed
	}

	return string(decrypted), nil
}

func GenerateKey() (string, error) {
	key := make([]byte, KeyLength)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return "", errors.Wrap(err, "failed to generate random key")
	}
	return base64.StdEncoding.EncodeToString(key), nil
}

func MustGenerateKey() string {
	key, err := GenerateKey()
	if err != nil {
		panic(err)
	}
	return key
}

package usecase

import (
	"encoding/hex"
	"testing"

	"github.com/google/uuid"

	"github.com/specvital/web/src/backend/modules/spec-view/domain/entity"
)

func TestGroupUncachedByFile(t *testing.T) {
	codebaseID := uuid.New()

	t.Run("multiple files have independent indices starting from 1", func(t *testing.T) {
		metas := []testMeta{
			{cacheKeyHash: []byte{1}, filePath: "file1.spec.ts", originalName: "test1", suiteHierarchy: "suite1"},
			{cacheKeyHash: []byte{2}, filePath: "file1.spec.ts", originalName: "test2", suiteHierarchy: "suite1"},
			{cacheKeyHash: []byte{3}, filePath: "file2.spec.ts", originalName: "test3", suiteHierarchy: "suite2"},
			{cacheKeyHash: []byte{4}, filePath: "file2.spec.ts", originalName: "test4", suiteHierarchy: "suite2"},
			{cacheKeyHash: []byte{5}, filePath: "file2.spec.ts", originalName: "test5", suiteHierarchy: "suite2"},
		}
		cached := make(map[string]*entity.CacheEntry)

		result := groupUncachedByFile(metas, cached)

		if len(result) != 2 {
			t.Errorf("expected 2 files, got %d", len(result))
		}

		file1 := result["file1.spec.ts"]
		if file1 == nil {
			t.Fatal("file1.spec.ts not found")
		}
		if len(file1.indexToMeta) != 2 {
			t.Errorf("file1 expected 2 tests, got %d", len(file1.indexToMeta))
		}
		if _, ok := file1.indexToMeta["1"]; !ok {
			t.Error("file1 should have index '1'")
		}
		if _, ok := file1.indexToMeta["2"]; !ok {
			t.Error("file1 should have index '2'")
		}

		file2 := result["file2.spec.ts"]
		if file2 == nil {
			t.Fatal("file2.spec.ts not found")
		}
		if len(file2.indexToMeta) != 3 {
			t.Errorf("file2 expected 3 tests, got %d", len(file2.indexToMeta))
		}
		if _, ok := file2.indexToMeta["1"]; !ok {
			t.Error("file2 should have index '1' (not global '3')")
		}
		if _, ok := file2.indexToMeta["2"]; !ok {
			t.Error("file2 should have index '2' (not global '4')")
		}
		if _, ok := file2.indexToMeta["3"]; !ok {
			t.Error("file2 should have index '3' (not global '5')")
		}
	})

	t.Run("cached tests are excluded from indexing", func(t *testing.T) {
		metas := []testMeta{
			{cacheKeyHash: []byte{1}, filePath: "file.spec.ts", originalName: "test1", suiteHierarchy: "suite"},
			{cacheKeyHash: []byte{2}, filePath: "file.spec.ts", originalName: "test2", suiteHierarchy: "suite"},
			{cacheKeyHash: []byte{3}, filePath: "file.spec.ts", originalName: "test3", suiteHierarchy: "suite"},
		}
		cached := map[string]*entity.CacheEntry{
			hex.EncodeToString([]byte{2}): {ConvertedName: "cached"},
		}

		result := groupUncachedByFile(metas, cached)

		file := result["file.spec.ts"]
		if file == nil {
			t.Fatal("file.spec.ts not found")
		}
		if len(file.indexToMeta) != 2 {
			t.Errorf("expected 2 uncached tests, got %d", len(file.indexToMeta))
		}
		if file.indexToMeta["1"].originalName != "test1" {
			t.Errorf("index '1' should be test1, got %s", file.indexToMeta["1"].originalName)
		}
		if file.indexToMeta["2"].originalName != "test3" {
			t.Errorf("index '2' should be test3, got %s", file.indexToMeta["2"].originalName)
		}
	})

	t.Run("empty input returns empty result", func(t *testing.T) {
		result := groupUncachedByFile(nil, nil)

		if len(result) != 0 {
			t.Errorf("expected empty result, got %d files", len(result))
		}
	})

	t.Run("all cached returns empty result", func(t *testing.T) {
		metas := []testMeta{
			{cacheKeyHash: []byte{1}, filePath: "file.spec.ts", originalName: "test1", suiteHierarchy: "suite"},
		}
		cached := map[string]*entity.CacheEntry{
			hex.EncodeToString([]byte{1}): {ConvertedName: "cached"},
		}

		result := groupUncachedByFile(metas, cached)

		if len(result) != 0 {
			t.Errorf("expected empty result when all cached, got %d files", len(result))
		}
	})

	t.Run("suites are properly grouped per file", func(t *testing.T) {
		metas := []testMeta{
			{cacheKeyHash: []byte{1}, filePath: "file.spec.ts", originalName: "test1", suiteHierarchy: "suiteA"},
			{cacheKeyHash: []byte{2}, filePath: "file.spec.ts", originalName: "test2", suiteHierarchy: "suiteB"},
			{cacheKeyHash: []byte{3}, filePath: "file.spec.ts", originalName: "test3", suiteHierarchy: "suiteA"},
		}
		cached := make(map[string]*entity.CacheEntry)

		result := groupUncachedByFile(metas, cached)

		file := result["file.spec.ts"]
		if file == nil {
			t.Fatal("file.spec.ts not found")
		}
		if len(file.suites) != 2 {
			t.Errorf("expected 2 suites, got %d", len(file.suites))
		}
	})

	_ = codebaseID
}

package mapper

import (
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/spec-view/usecase"
)

func ToConvertSpecViewResponse(output *usecase.ConvertSpecViewOutput) api.ConvertSpecViewResponse {
	if output == nil {
		return api.ConvertSpecViewResponse{}
	}

	files := make([]api.ConvertedTestFile, len(output.Files))
	for i, file := range output.Files {
		files[i] = toConvertedTestFile(file)
	}

	return api.ConvertSpecViewResponse{
		Data: files,
		Summary: api.ConversionSummary{
			CachedCount:    output.Summary.CachedCount,
			ConvertedAt:    output.Summary.ConvertedAt,
			ConvertedCount: output.Summary.ConvertedCount,
			TotalTests:     output.Summary.TotalTests,
		},
	}
}

func toConvertedTestFile(file usecase.FileConversionResult) api.ConvertedTestFile {
	suites := make([]api.ConvertedTestSuite, len(file.Suites))
	for i, suite := range file.Suites {
		suites[i] = toConvertedTestSuite(suite)
	}

	return api.ConvertedTestFile{
		FilePath:  file.FilePath,
		Framework: file.Framework,
		Suites:    suites,
	}
}

func toConvertedTestSuite(suite usecase.SuiteConversionResult) api.ConvertedTestSuite {
	tests := make([]api.ConvertedTestItem, len(suite.Tests))
	for i, test := range suite.Tests {
		tests[i] = toConvertedTestItem(test)
	}

	return api.ConvertedTestSuite{
		SuiteHierarchy: suite.Hierarchy,
		SuiteName:      suite.Name,
		Tests:          tests,
	}
}

func toConvertedTestItem(test usecase.TestConversionResult) api.ConvertedTestItem {
	item := api.ConvertedTestItem{
		ConvertedName: test.ConvertedName,
		IsFromCache:   test.IsFromCache,
		Line:          test.Line,
		OriginalName:  test.OriginalName,
		Status:        toAPITestStatus(test.Status),
	}

	if test.Modifier != "" {
		item.Modifier = &test.Modifier
	}

	return item
}

func toAPITestStatus(status string) api.TestStatus {
	switch status {
	case "active":
		return api.Active
	case "focused":
		return api.Focused
	case "skipped":
		return api.Skipped
	case "todo":
		return api.Todo
	case "xfail":
		return api.Xfail
	default:
		return api.Active
	}
}

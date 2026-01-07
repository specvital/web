package adapter

import (
	"fmt"
	"strings"

	"github.com/specvital/web/src/backend/modules/spec-view/domain/entity"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/port"
)

const convertTestNamesTemplate = `Convert test names to user-facing feature descriptions in %s for non-technical product managers.

<thinking_process>
For each test name, mentally follow these steps:
1. EXTRACT: What is the core behavior being tested? Ignore HOW it's tested.
2. TRANSLATE: Convert ALL text to %s (target language). English phrases must also be translated.
3. SIMPLIFY: Describe from user's perspective, not developer's. What does this feature DO for the user?
</thinking_process>

<rules>
1. STRIP test syntax: should, must, it, test, spec, when, given, then, if, expect, assert, verify, returns, throws, describe, context
2. FOCUS on user value, not implementation:
   - "caches result" -> "Fast repeated access"
   - "validates input" -> "Input format verification"
   - "throws error" -> "Error notification"
   - "returns null" -> "Empty result handling"
3. USE hierarchy for context when test name alone is ambiguous:
   - hierarchy="EmailService > Validation", name="invalid" -> "Email format validation"
   - hierarchy="Cart > Checkout", name="empty" -> "Empty cart checkout prevention"
4. HANDLE special cases:
   - Parameterized tests (contains ":"): Extract concept, ignore specific values
   - Numeric/meaningless names: Derive meaning from hierarchy
   - Negation tests: Frame as protection or prevention
5. LENGTH: Max 50 characters. Prefer noun phrases.
6. LANGUAGE: ALL output MUST be in %s. Translate English phrases too. Only keep universal terms (API, HTTP, JSON).
7. NEVER include code literals in output:
   - Variable names (camelCase, snake_case) -> natural language concepts
   - Type names (GroupButton, UserService) -> describe user-visible element
   - Boolean conditions (isX=true, hasY=false) -> describe the state/mode
   - Function/method calls -> describe the action result
</rules>

<examples>
These are GENERIC patterns - apply the same logic to any similar input:

Pattern 1 - English test names must be translated:
Input: "should allow user input and persist value"
Output: "사용자 입력 저장" (NOT English)

Pattern 2 - Code literals (camelCase/PascalCase) must become natural language:
Input: "isEnabled가 true일 때 MyButton으로 타입 좁힘"
Output: "활성화 시 버튼 타입 자동 인식"

Pattern 3 - Function calls must describe the result:
Input: "handleSubmit saves form data"
Output: "폼 제출 시 데이터 저장"

Pattern 4 - Boolean conditions must describe the state:
Input: "when hasPermission is false returns error"
Output: "권한 없을 때 오류 반환"
</examples>

`

const convertTestNamesInputHeader = "<input>\n"
const convertTestNamesInputFooter = `</input>

<output_format>
Return JSON object where each key is the global_index (as string) and value is the converted name.
Example: {"1": "Session creation on login", "2": "Response caching", "3": "Email format validation"}
</output_format>`

func buildPrompt(input port.ConvertInput) string {
	langName := languageDisplayName(input.Language)

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf(convertTestNamesTemplate, langName, langName, langName))
	sb.WriteString(convertTestNamesInputHeader)

	globalIndex := 1
	for _, suite := range input.Suites {
		sb.WriteString(fmt.Sprintf("## %s\n", suite.Hierarchy))
		for _, testName := range suite.Tests {
			sb.WriteString(fmt.Sprintf("%d|%s\n", globalIndex, testName))
			globalIndex++
		}
		sb.WriteString("\n")
	}

	sb.WriteString(convertTestNamesInputFooter)

	return sb.String()
}

var languageDisplayNames = map[entity.Language]string{
	entity.LanguageAr: "Arabic",
	entity.LanguageCs: "Czech",
	entity.LanguageDa: "Danish",
	entity.LanguageDe: "German",
	entity.LanguageEl: "Greek",
	entity.LanguageEn: "English",
	entity.LanguageEs: "Spanish",
	entity.LanguageFi: "Finnish",
	entity.LanguageFr: "French",
	entity.LanguageHi: "Hindi",
	entity.LanguageId: "Indonesian",
	entity.LanguageIt: "Italian",
	entity.LanguageJa: "Japanese",
	entity.LanguageKo: "Korean",
	entity.LanguageNl: "Dutch",
	entity.LanguagePl: "Polish",
	entity.LanguagePt: "Portuguese",
	entity.LanguageRu: "Russian",
	entity.LanguageSv: "Swedish",
	entity.LanguageTh: "Thai",
	entity.LanguageTr: "Turkish",
	entity.LanguageUk: "Ukrainian",
	entity.LanguageVi: "Vietnamese",
	entity.LanguageZh: "Chinese",
}

func languageDisplayName(lang entity.Language) string {
	if name, ok := languageDisplayNames[lang]; ok {
		return name
	}
	return "English"
}

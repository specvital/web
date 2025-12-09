-- name: GetLatestCompletedAnalysis :one
SELECT
    a.id,
    a.commit_sha,
    a.completed_at,
    a.total_suites,
    a.total_tests,
    c.owner,
    c.name as repo
FROM analyses a
JOIN codebases c ON c.id = a.codebase_id
WHERE c.host = $1 AND c.owner = $2 AND c.name = $3
  AND a.status = 'completed'
ORDER BY a.created_at DESC
LIMIT 1;

-- name: GetAnalysisStatus :one
SELECT
    a.id,
    a.status,
    a.error_message,
    a.created_at,
    a.completed_at
FROM analyses a
JOIN codebases c ON c.id = a.codebase_id
WHERE c.host = $1 AND c.owner = $2 AND c.name = $3
ORDER BY a.created_at DESC
LIMIT 1;

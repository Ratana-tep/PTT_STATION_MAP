<?php
function executeGitCommands($commitMessage, $directoryPath) {
    $githubToken = ''; // Replace with your GitHub token
    $owner = 'pttpos'; // Replace with your GitHub username
    $repo = 'map_ptt'; // Replace with your repository name
    $branch = 'main'; // Replace with your branch name

    $allowedDirs = ['data', 'pictures'];

    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directoryPath));
    $changes = [];
    $hasChanges = false;

    foreach ($iterator as $file) {
        if ($file->isDir() || strpos($file->getPathname(), DIRECTORY_SEPARATOR . '.git' . DIRECTORY_SEPARATOR) !== false) {
            continue;
        }

        $filePath = $file->getPathname();
        $repoPath = str_replace($directoryPath . DIRECTORY_SEPARATOR, '', $filePath);

        // Skip files not in the allowed directories
        $pathParts = explode(DIRECTORY_SEPARATOR, $repoPath);
        if (!in_array($pathParts[0], $allowedDirs)) {
            continue;
        }

        $fileContent = file_get_contents($filePath);
        $fileContentBase64 = base64_encode($fileContent);

        $apiUrl = "https://api.github.com/repos/$owner/$repo/contents/$repoPath";

        // Get the file's SHA
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_USERAGENT, $owner);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: token $githubToken"
        ]);
        $response = curl_exec($ch);
        $fileData = json_decode($response, true);
        $sha = isset($fileData['sha']) ? $fileData['sha'] : null;
        curl_close($ch);

        // Skip the file if there are no changes
        if ($sha && base64_decode($fileData['content']) === $fileContent) {
            continue;
        }

        $hasChanges = true;

        // Collect changes
        $changes[$repoPath] = [
            'message' => $commitMessage,
            'content' => $fileContentBase64,
            'branch' => $branch,
            'sha' => $sha
        ];
    }

    // Commit changes
    foreach ($changes as $repoPath => $data) {
        $apiUrl = "https://api.github.com/repos/$owner/$repo/contents/$repoPath";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_USERAGENT, $owner);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: token $githubToken",
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $response = curl_exec($ch);
        $result = json_decode($response, true);
        curl_close($ch);

        if (!isset($result['commit'])) {
            echo "<pre>Error committing $repoPath to GitHub: " . json_encode($result) . "</pre>";
        } else {
            echo "<pre>Successfully committed $repoPath</pre>";
        }
    }

    return $hasChanges;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['commit_changes'])) {
        $commitMessage = "Updated files in 'data' and 'pictures' directories " . date('Y-m-d H:i:s');
        $directoryPath = '.'; // Directory to read files from (current directory)

        // Execute git commands
        $hasChanges = executeGitCommands($commitMessage, $directoryPath);

        // Set the status and message based on whether there were changes
        $status = $hasChanges ? 'success' : 'warning';
        $message = $hasChanges ? 'Changes committed to GitHub successfully.' : 'No changes detected, nothing to commit.';

        // Redirect with status message
        header('Location: manage.php?status=' . $status . '&message=' . urlencode($message));
        exit();
    }
}
?>

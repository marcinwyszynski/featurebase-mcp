# Publishing to Smithery

This guide walks you through publishing the Featurebase MCP server to Smithery and npm.

## Prerequisites

1. A GitHub repository for your MCP server
2. An npm account (for npm publishing)
3. A Smithery account

## Step 1: Prepare Your Repository

1. Update the placeholders in `package.json`:
   - Replace `"Your Name <your.email@example.com>"` with your actual name and email
   - Replace `yourusername` in all URLs with your GitHub username

2. Update the placeholders in `smithery.json`:
   - Replace `"Your Name"` with your actual name
   - Replace `yourusername` in the GitHub URL with your GitHub username

3. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/featurebase-mcp.git
   git push -u origin main
   ```

## Step 2: Publish to npm (Optional but Recommended)

1. Create an npm account at https://www.npmjs.com if you don't have one

2. Login to npm:
   ```bash
   npm login
   ```

3. Build and publish:
   ```bash
   npm run build
   npm publish
   ```

4. Test the global installation:
   ```bash
   npm install -g featurebase-mcp
   featurebase-mcp
   ```

## Step 3: Submit to Smithery

1. Visit [Smithery](https://smithery.ai) and sign in

2. Click "Submit a Server" or similar button

3. Provide your GitHub repository URL: `https://github.com/yourusername/featurebase-mcp`

4. Smithery will automatically:
   - Validate your `smithery.json` file
   - Check your repository structure
   - Verify the tools and configuration

5. Fill out any additional information requested:
   - Detailed description
   - Usage examples
   - Screenshots (if applicable)
   - Demo video (optional)

## Step 4: Post-Submission

1. **Monitor Issues**: Watch your GitHub repository for issues from users

2. **Update Regularly**: Keep your server updated with:
   - Bug fixes
   - New Featurebase API features
   - MCP SDK updates

3. **Version Management**:
   - Use semantic versioning
   - Update version in both `package.json` and `smithery.json`
   - Tag releases on GitHub

4. **Community Engagement**:
   - Respond to issues promptly
   - Accept pull requests when appropriate
   - Update documentation based on user feedback

## Configuration in Claude Desktop

Once published, users can configure your server in Claude Desktop:

```json
{
  "mcpServers": {
    "featurebase": {
      "command": "npx",
      "args": ["featurebase-mcp"],
      "env": {
        "FEATUREBASE_API_KEY": "their-api-key-here"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "featurebase": {
      "command": "featurebase-mcp",
      "env": {
        "FEATUREBASE_API_KEY": "their-api-key-here"
      }
    }
  }
}
```

## Troubleshooting

- **Validation Errors**: Ensure your `smithery.json` follows the schema
- **npm Publishing**: Make sure you're logged in and have a unique package name

## Updates

To update your server on Smithery:

1. Update your code and push to GitHub
2. Update version numbers in `package.json` and `smithery.json`
3. Publish new version to npm: `npm publish`
4. Create a GitHub release with changelog
5. Smithery will automatically detect the update
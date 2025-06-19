# Featurebase MCP Server

[![smithery badge](https://smithery.ai/badge/@marcinwyszynski/featurebase-mcp)](https://smithery.ai/server/@marcinwyszynski/featurebase-mcp)

A Model Context Protocol (MCP) server that provides access to the Featurebase API for managing posts and comments.

## Features

- **Posts Management**
  - List posts with filtering options
  - Create new posts
  - Update existing posts
  - Delete posts
  - Get post upvoters
  - Add upvoters to posts

- **Comments Management**
  - Get comments for posts/changelogs
  - Create new comments or replies
  - Update comments
  - Delete comments

## Installation

### From Smithery (Recommended)

Once published to Smithery, users can install the server easily:

```bash
npx featurebase-mcp
```

Or install globally:

```bash
npm install -g featurebase-mcp
```

### From Source

```bash
git clone https://github.com/marcinwyszynski/featurebase-mcp.git
cd featurebase-mcp
npm install
npm run build
```

## Usage

### Claude Desktop Configuration

Add this server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Using npx (Recommended)

```json
{
  "mcpServers": {
    "featurebase": {
      "command": "npx",
      "args": ["featurebase-mcp"],
      "env": {
        "FEATUREBASE_API_KEY": "your-api-key-here",
        "FEATUREBASE_ORG_URL": "https://your-org.featurebase.app"
      }
    }
  }
}
```

#### Using Global Installation

```json
{
  "mcpServers": {
    "featurebase": {
      "command": "featurebase-mcp",
      "env": {
        "FEATUREBASE_API_KEY": "your-api-key-here",
        "FEATUREBASE_ORG_URL": "https://your-org.featurebase.app"
      }
    }
  }
}
```

#### Using Local Installation

```json
{
  "mcpServers": {
    "featurebase": {
      "command": "node",
      "args": ["/path/to/featurebase-mcp/build/index.js"],
      "env": {
        "FEATUREBASE_API_KEY": "your-api-key-here",
        "FEATUREBASE_ORG_URL": "https://your-org.featurebase.app"
      }
    }
  }
}
```

### Getting Your API Key

1. Log in to your Featurebase account
2. Navigate to your account settings
3. Generate an API key
4. Keep it secure - never commit it to version control

### Environment Variables

The server requires these environment variables:

#### Required
- `FEATUREBASE_API_KEY`: Your FeatureBase API key

#### Optional  
- `FEATUREBASE_ORG_URL`: Your organization's FeatureBase URL (e.g., "https://feedback.spacelift.io"). Required only if using `resolve_post_slug` tool.
- `FEATUREBASE_BASE_URL`: Custom API base URL (defaults to "https://do.featurebase.app/v2")

You can set them:

1. In your Claude Desktop configuration (recommended)
2. Export in your shell: `export FEATUREBASE_API_KEY="your-api-key-here"`
3. When running the server: `FEATUREBASE_API_KEY="your-api-key-here" npx featurebase-mcp`

## Available Tools

### Posts

#### `list_posts`
List posts with optional filtering.

Parameters:
- `id`: Find specific post by ID
- `q`: Search posts by title or content
- `category`: Filter by board names (array)
- `status`: Filter by status IDs (array)
- `sortBy`: Sort order (e.g., "date:desc", "upvotes:desc")
- `startDate`: Posts created after this date
- `endDate`: Posts created before this date
- `limit`: Results per page
- `page`: Page number

#### `create_post`
Create a new post.

Parameters:
- `title` (required): Post title (min 2 characters)
- `category` (required): Board/category name
- `content`: Post content
- `email`: Submitter's email
- `authorName`: Name for new users
- `tags`: Array of tag names
- `commentsAllowed`: Enable/disable comments
- `status`: Post status
- `date`: Creation date
- `customInputValues`: Custom field values

#### `update_post`
Update an existing post.

Parameters:
- `id` (required): Post ID to update
- `title`: New title
- `content`: New content
- `status`: New status
- `commentsAllowed`: Enable/disable comments
- `category`: New category
- `sendStatusUpdateEmail`: Email upvoters about status change
- `tags`: New tags
- `inReview`: Put post in review
- `date`: Creation date
- `customInputValues`: Custom field values

#### `delete_post`
Permanently delete a post.

Parameters:
- `id` (required): Post ID to delete

#### `get_post_upvoters`
Get list of users who upvoted a post.

Parameters:
- `submissionId` (required): Post ID
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10, max: 100)

#### `add_upvoter`
Add an upvoter to a post.

Parameters:
- `id` (required): Post ID
- `email` (required): Upvoter's email
- `name` (required): Upvoter's name

#### `resolve_post_slug`
Convert a post slug to post ID and get complete post details.

Parameters:
- `slug` (required): Post slug from URL (e.g., "spacectl-stack-local-preview-target")

Returns the complete post data including ID, title, content, and metadata.

#### `get_similar_submissions`
Find posts similar to the given query text.

Parameters:
- `query` (required): Search query text to find similar submissions
- `locale`: Locale for search (default: "en")

Returns a list of similar posts based on content similarity.

### Comments

#### `get_comments`
Get comments for a post or changelog.

Parameters:
- `submissionId`: Post ID or slug (required if no changelogId)
- `changelogId`: Changelog ID or slug (required if no submissionId)
- `privacy`: Filter by privacy ("public", "private", "all")
- `inReview`: Filter for comments in review
- `commentThreadId`: Get all comments in a thread
- `limit`: Results per page (default: 10)
- `page`: Page number (default: 1)
- `sortBy`: Sort order ("best", "top", "new", "old")

#### `create_comment`
Create a new comment or reply.

Parameters:
- `content` (required): Comment content
- `submissionId`: Post ID or slug (required if no changelogId)
- `changelogId`: Changelog ID or slug (required if no submissionId)
- `parentCommentId`: Parent comment ID for replies
- `isPrivate`: Make comment private (admins only)
- `sendNotification`: Notify voters (default: true)
- `createdAt`: Set creation date
- `author`: Post as specific user (object with name, email, profilePicture)

#### `update_comment`
Update an existing comment.

Parameters:
- `id` (required): Comment ID
- `content`: New content
- `isPrivate`: Make private (admins only)
- `pinned`: Pin comment to top
- `inReview`: Put comment in review
- `createdAt`: Update creation date

#### `delete_comment`
Delete a comment (soft delete if it has replies).

Parameters:
- `id` (required): Comment ID to delete

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

## Security

- Never hardcode your API key
- Always use environment variables for API keys
- Keep your API key secure and rotate it regularly
- The server will not start without a valid `FEATUREBASE_API_KEY` environment variable

## Publishing

This server is available on:
- [Smithery](https://smithery.ai/server/featurebase) - MCP server registry
- [npm](https://www.npmjs.com/package/featurebase-mcp) - Node package manager

For publishing instructions, see [PUBLISHING.md](./PUBLISHING.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

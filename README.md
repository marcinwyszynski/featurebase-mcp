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
        "FEATUREBASE_API_KEY": "your-api-key-here"
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
        "FEATUREBASE_API_KEY": "your-api-key-here"
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
        "FEATUREBASE_API_KEY": "your-api-key-here"
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

### Setting the API Key

The server requires the `FEATUREBASE_API_KEY` environment variable to be set. You can:

1. Set it in your Claude Desktop configuration (recommended)
2. Export it in your shell: `export FEATUREBASE_API_KEY="your-api-key-here"`
3. Set it when running the server: `FEATUREBASE_API_KEY="your-api-key-here" npx featurebase-mcp`

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

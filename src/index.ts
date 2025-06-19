#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";
import mask from "json-mask";

const commentModel = "upvoted, downvoted, inReview, isSpam, pinned, emailSent, sendNotification, organization, submission, author, authorId, authorPicture, isPrivate, isDeleted, confidenceScore, content, upvotes, downvotes, score, parentComment, path, createdAt, updatedAt, id";

interface FeaturebaseConfig {
  apiKey: string;
  baseUrl?: string;
  orgUrl?: string;
}

class FeaturebaseAPI {
  private client: AxiosInstance;
  private orgUrl: string;

  constructor(config: FeaturebaseConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl || "https://do.featurebase.app/v2",
      headers: {
        "X-API-Key": config.apiKey,
        "Content-Type": "application/json",
      },
    });
    this.orgUrl = config.orgUrl || "";
  }

  // Posts endpoints
  async listPosts(params?: {
    id?: string;
    q?: string;
    category?: string[];
    status?: string[];
    sortBy?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
  }) {
    const response = await this.client.get("/posts", { params });
    return response.data;
  }

  async createPost(data: {
    title: string;
    category: string;
    content?: string;
    email?: string;
    authorName?: string;
    tags?: string[];
    commentsAllowed?: boolean;
    status?: string;
    date?: string;
    customInputValues?: Record<string, any>;
  }) {
    const response = await this.client.post("/posts", data);
    return response.data;
  }

  async updatePost(data: {
    id: string;
    title?: string;
    content?: string;
    status?: string;
    commentsAllowed?: boolean;
    category?: string;
    sendStatusUpdateEmail?: boolean;
    tags?: string[];
    inReview?: boolean;
    date?: string;
    customInputValues?: Record<string, any>;
  }) {
    const response = await this.client.patch("/posts", data);
    return response.data;
  }

  async deletePost(id: string) {
    const response = await this.client.delete("/posts", { data: { id } });
    return response.data;
  }

  async getPostUpvoters(
    submissionId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const response = await this.client.get("/posts/upvoters", {
      params: { submissionId, page, limit },
    });
    return response.data;
  }

  async addUpvoter(id: string, email: string, name: string) {
    const response = await this.client.post("/posts/upvoters", {
      id,
      email,
      name,
    });
    return response.data;
  }

  async resolvePostSlug(slug: string) {
    if (!this.orgUrl) {
      throw new Error("FEATUREBASE_ORG_URL environment variable is required for slug resolution");
    }
    const response = await axios.get(`${this.orgUrl}/api/v1/submission`, {
      params: { slug },
    });
    return response.data;
  }

  async getSimilarSubmissions(query: string, locale: string = "en") {
    if (!this.orgUrl) {
      throw new Error("FEATUREBASE_ORG_URL environment variable is required for similar submissions");
    }
    const response = await axios.get(`${this.orgUrl}/api/v1/submission/getSimilarSubmissions`, {
      params: { query, locale },
    });
    return response.data;
  }

  // Comments endpoints
  async getComments(params: {
    submissionId?: string;
    changelogId?: string;
    privacy?: "public" | "private" | "all";
    inReview?: boolean;
    commentThreadId?: string;
    limit?: number;
    page?: number;
    sortBy?: "best" | "top" | "new" | "old";
  }) {
    const response = await this.client.get("/comment", { params });
    return response.data;
  }

  async createComment(data: {
    submissionId?: string;
    changelogId?: string;
    content: string;
    parentCommentId?: string;
    isPrivate?: boolean;
    sendNotification?: boolean;
    createdAt?: string;
    author?: {
      name: string;
      email: string;
      profilePicture?: string;
    };
  }) {
    const response = await this.client.post("/comment", data);
    return response.data;
  }

  async updateComment(data: {
    id: string;
    content?: string;
    isPrivate?: boolean;
    pinned?: boolean;
    inReview?: boolean;
    createdAt?: string;
  }) {
    const response = await this.client.patch("/comment", data);
    return response.data;
  }

  async deleteComment(id: string) {
    const response = await this.client.delete("/comment", { data: { id } });
    return response.data;
  }
}

class FeaturebaseMCPServer {
  private server: Server;
  private api: FeaturebaseAPI;

  constructor() {
    const apiKey = process.env.FEATUREBASE_API_KEY;
    if (!apiKey) {
      throw new Error("FEATUREBASE_API_KEY environment variable is required");
    }

    const baseUrl = process.env.FEATUREBASE_BASE_URL;
    const orgUrl = process.env.FEATUREBASE_ORG_URL;
    this.api = new FeaturebaseAPI({ apiKey, baseUrl, orgUrl });

    this.server = new Server(
      {
        name: "featurebase-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Posts tools
        {
          name: "list_posts",
          description:
            "List posts with optional filtering. Available fields: id, title, content, author, authorId, authorPicture, commentsAllowed, organization, upvotes, upvoted, postCategory(category,private,prefill,roles,hiddenFromRoles,id), postTags(name,color,private,id), postStatus(name,color,type,isDefault,id), date, lastModified, comments, isSubscribed, inReview, lastDraggedTimestamps",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Find submission by its id" },
              q: {
                type: "string",
                description: "Search for posts by title or content",
              },
              category: {
                type: "array",
                items: { type: "string" },
                description: "Filter posts by category (board) names",
              },
              status: {
                type: "array",
                items: { type: "string" },
                description: "Filter posts by status ids",
              },
              sortBy: {
                type: "string",
                description: 'Sort posts (e.g., "date:desc" or "upvotes:desc")',
              },
              startDate: {
                type: "string",
                description: "Get posts created after this date",
              },
              endDate: {
                type: "string",
                description: "Get posts created before this date",
              },
              limit: {
                type: "number",
                description: "Number of results per page",
              },
              page: { type: "number", description: "Page number" },
              select: {
                type: "string",
                description:
                  'Fields to return. Examples: "id,title,upvotes" | "title,author(name)" | "postCategory(category),postStatus(name)". Leave empty for all fields.',
              },
            },
            required: [],
          },
        },
        {
          name: "create_post",
          description: "Create a new post",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Post title (min 2 characters)",
              },
              category: {
                type: "string",
                description: "The board (category) for the post",
              },
              content: {
                type: "string",
                description: "Post content (can be empty)",
              },
              email: {
                type: "string",
                description: "Email of the user submitting",
              },
              authorName: {
                type: "string",
                description: "Name for new user if email not found",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Array of tag names",
              },
              commentsAllowed: {
                type: "boolean",
                description: "Allow comments on post",
              },
              status: { type: "string", description: "Post status" },
              date: { type: "string", description: "Post creation date" },
              customInputValues: {
                type: "object",
                description: "Custom field values",
              },
            },
            required: ["title", "category"],
          },
        },
        {
          name: "update_post",
          description: "Update an existing post",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Post ID to update" },
              title: { type: "string", description: "New title" },
              content: { type: "string", description: "New content" },
              status: { type: "string", description: "New status" },
              commentsAllowed: {
                type: "boolean",
                description: "Allow comments",
              },
              category: { type: "string", description: "New category" },
              sendStatusUpdateEmail: {
                type: "boolean",
                description: "Send status update email to upvoters",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "New tags",
              },
              inReview: { type: "boolean", description: "Put post in review" },
              date: { type: "string", description: "Post creation date" },
              customInputValues: {
                type: "object",
                description: "Custom field values",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "delete_post",
          description: "Delete a post permanently",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Post ID to delete" },
            },
            required: ["id"],
          },
        },
        {
          name: "get_post_upvoters",
          description: "Get list of users who upvoted a post",
          inputSchema: {
            type: "object",
            properties: {
              submissionId: { type: "string", description: "Post ID" },
              page: { type: "number", description: "Page number (default: 1)" },
              limit: {
                type: "number",
                description: "Results per page (default: 10, max: 100)",
              },
            },
            required: ["submissionId"],
          },
        },
        {
          name: "add_upvoter",
          description: "Add an upvoter to a post",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Post ID" },
              email: { type: "string", description: "Upvoter email" },
              name: { type: "string", description: "Upvoter name" },
            },
            required: ["id", "email", "name"],
          },
        },
        // Comments tools
        {
          name: "get_comments",
          description:
            `Get comments for a post or changelog. Available fields: ${commentModel}, replies(${commentModel})`,
          inputSchema: {
            type: "object",
            properties: {
              submissionId: {
                type: "string",
                description: "Post ID or slug (required if no changelogId)",
              },
              changelogId: {
                type: "string",
                description:
                  "Changelog ID or slug (required if no submissionId)",
              },
              privacy: {
                type: "string",
                enum: ["public", "private", "all"],
                description: "Filter by privacy setting",
              },
              inReview: {
                type: "boolean",
                description: "Filter for comments in review",
              },
              commentThreadId: {
                type: "string",
                description: "Get all comments in a thread",
              },
              limit: {
                type: "number",
                description: "Results per page (default: 10)",
              },
              page: { type: "number", description: "Page number (default: 1)" },
              sortBy: {
                type: "string",
                enum: ["best", "top", "new", "old"],
                description: "Sort order (default: best)",
              },
              select: {
                type: "string",
                description:
                  'Fields to return. Examples: "id,content,author(name)" | "content,upvotes,createdAt" | "author(name,email),replies(content)". Leave empty for all fields.',
              },
            },
            required: [],
          },
        },
        {
          name: "create_comment",
          description: "Create a new comment or reply",
          inputSchema: {
            type: "object",
            properties: {
              submissionId: {
                type: "string",
                description: "Post ID or slug (required if no changelogId)",
              },
              changelogId: {
                type: "string",
                description:
                  "Changelog ID or slug (required if no submissionId)",
              },
              content: { type: "string", description: "Comment content" },
              parentCommentId: {
                type: "string",
                description: "Parent comment ID for replies",
              },
              isPrivate: {
                type: "boolean",
                description: "Make comment private (admins only)",
              },
              sendNotification: {
                type: "boolean",
                description: "Notify voters (default: true)",
              },
              createdAt: { type: "string", description: "Set creation date" },
              author: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  profilePicture: { type: "string" },
                },
                description: "Post as specific user",
              },
            },
            required: ["content"],
          },
        },
        {
          name: "update_comment",
          description: "Update an existing comment",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Comment ID" },
              content: { type: "string", description: "New content" },
              isPrivate: {
                type: "boolean",
                description: "Make private (admins only)",
              },
              pinned: { type: "boolean", description: "Pin comment to top" },
              inReview: {
                type: "boolean",
                description: "Put comment in review",
              },
              createdAt: {
                type: "string",
                description: "Update creation date",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "delete_comment",
          description: "Delete a comment (soft delete if has replies)",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Comment ID to delete" },
            },
            required: ["id"],
          },
        },
        {
          name: "resolve_post_slug",
          description: "Convert a post slug to post ID and get post details",
          inputSchema: {
            type: "object",
            properties: {
              slug: { 
                type: "string", 
                description: "Post slug from URL (e.g., 'spacectl-stack-local-preview-target')" 
              },
            },
            required: ["slug"],
          },
        },
        {
          name: "get_similar_submissions",
          description: "Find posts similar to the given query text",
          inputSchema: {
            type: "object",
            properties: {
              query: { 
                type: "string", 
                description: "Search query text to find similar submissions" 
              },
              locale: { 
                type: "string", 
                description: "Locale for search (default: 'en')" 
              },
            },
            required: ["query"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Posts handlers
          case "list_posts": {
            const { select, ...apiArgs } = args as any;
            const result = await this.api.listPosts(apiArgs);

            const filtered = select
              ? {
                  ...result,
                  results:
                    result.results?.map((post: any) => mask(post, select)) ||
                    [],
                }
              : result;
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(filtered),
                },
              ],
            };
          }

          case "create_post": {
            const result = await this.api.createPost(args as any);
            const filtered = {
              success: result.success,
              submission: {
                id: result.submission?.id,
              },
            };
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(filtered),
                },
              ],
            };
          }

          case "update_post": {
            const result = await this.api.updatePost(args as any);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result),
                },
              ],
            };
          }

          case "delete_post": {
            const { id } = args as any;
            const result = await this.api.deletePost(id);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result),
                },
              ],
            };
          }

          case "get_post_upvoters": {
            const { submissionId, page = 1, limit = 10 } = args as any;
            const result = await this.api.getPostUpvoters(
              submissionId,
              page,
              limit
            );
            const filtered = {
              results:
                result.results?.map((upvoter: any) => ({
                  userId: upvoter.userId,
                  organizationId: upvoter.organizationId,
                  companies: upvoter.companies?.map((company: any) => ({
                    id: company.id,
                    name: company.name,
                  })),
                  email: upvoter.email,
                  name: upvoter.name,
                })) || [],
              page: result.page,
              limit: result.limit,
              totalPages: result.totalPages,
              totalResults: result.totalResults,
            };
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(filtered),
                },
              ],
            };
          }

          case "add_upvoter": {
            const { id, email, name } = args as any;
            const result = await this.api.addUpvoter(id, email, name);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result),
                },
              ],
            };
          }

          // Comments handlers
          case "get_comments": {
            const { select, ...apiArgs } = args as any;
            const result = await this.api.getComments(apiArgs);

            const filtered = select
              ? {
                  ...result,
                  results:
                    result.results?.map((comment: any) =>
                      mask(comment, select)
                    ) || [],
                }
              : result;
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(filtered),
                },
              ],
            };
          }

          case "create_comment": {
            const result = await this.api.createComment(args as any);
            const filtered = {
              success: result.success,
              comment: {
                id: result.comment?.id,
              },
            };
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(filtered),
                },
              ],
            };
          }

          case "update_comment": {
            const result = await this.api.updateComment(args as any);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result),
                },
              ],
            };
          }

          case "delete_comment": {
            const { id } = args as any;
            const result = await this.api.deleteComment(id);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result),
                },
              ],
            };
          }

          case "resolve_post_slug": {
            const { slug } = args as any;
            const result = await this.api.resolvePostSlug(slug);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result),
                },
              ],
            };
          }

          case "get_similar_submissions": {
            const { query, locale = "en" } = args as any;
            const result = await this.api.getSimilarSubmissions(query, locale);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result),
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error: any) {
        if (error.response) {
          throw new McpError(
            ErrorCode.InternalError,
            `Featurebase API error: ${error.response.status} - ${JSON.stringify(
              error.response.data
            )}`
          );
        }
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Featurebase MCP server running on stdio");
  }
}

const server = new FeaturebaseMCPServer();
server.run().catch(console.error);

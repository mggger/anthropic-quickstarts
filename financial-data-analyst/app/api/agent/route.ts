// @ts-nocheck

import { NextRequest, NextResponse } from "next/server";
import {DataFormat} from "@/types/chart";
import {ChartConfig} from "@/types/chart";
import {ColumnDefinition} from "@/types/chart";

export const runtime = "edge";

const BACKEND_API_URL = process.env.BACKEND_API_URL;

// Helper to validate base64
const isValidBase64 = (str: string) => {
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
};

interface RequestBody {
    messages: any[];
    fileData?: {
        base64: string;
        mediaType: string;
        isText: boolean;
        fileName: string;
    };
    model: string;
    dataSource?: any;
}

export async function POST(req: NextRequest) {
    try {
        const { messages, fileData, model, dataSource } = await req.json() as RequestBody;

        console.log("🔍 Initial Request Data:", {
            hasMessages: !!messages,
            messageCount: messages?.length,
            hasFileData: !!fileData,
            fileType: fileData?.mediaType,
            model,
            hasDataSource: !!dataSource,
        });


        // Input validation
        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
        }

        if (!model) {
            return NextResponse.json({ error: "Model selection is required" }, { status: 400 });
        }

        // Convert all previous messages
        let processedMessages = messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
        }));

        // Handle file in the latest message
        if (fileData) {
            const { base64, mediaType, isText, fileName } = fileData;

            if (!base64) {
                console.error("❌ No base64 data received");
                return NextResponse.json({ error: "No file data" }, { status: 400 });
            }

            try {
                if (isText) {
                    // Decode base64 text content
                    const textContent = decodeURIComponent(escape(atob(base64)));

                    // Replace only the last message with the file content
                    processedMessages[processedMessages.length - 1] = {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `File contents of ${fileName}:\n\n${textContent}`,
                            },
                            {
                                type: "text",
                                text: messages[messages.length - 1].content,
                            },
                        ],
                    };
                } else if (mediaType.startsWith("image/")) {
                    // Handle image files
                    processedMessages[processedMessages.length - 1] = {
                        role: "user",
                        content: [
                            {
                                type: "image",
                                source: {
                                    type: "base64",
                                    media_type: mediaType,
                                    data: base64,
                                },
                            },
                            {
                                type: "text",
                                text: messages[messages.length - 1].content,
                            },
                        ],
                    };
                }
            } catch (error) {
                console.error("Error processing file content:", error);
                return NextResponse.json({ error: "Failed to process file content" }, { status: 400 });
            }
        }

        // Prepare the request body for the backend API
        const backendRequestBody = {
            messages: processedMessages,
            model,
            dataSource,
        };

        console.log("🚀 Forwarding request to backend API:", {
            url: `${BACKEND_API_URL}/agent`,
            messageCount: processedMessages.length,
            hasDataSource: !!dataSource,
        });

        // Forward the request to the backend API
        const backendResponse = await fetch(`${BACKEND_API_URL}/agent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
            },
            body: JSON.stringify(backendRequestBody),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json();
            console.error("❌ Backend API Error:", errorData);
            return NextResponse.json(
                { error: errorData.error || "An error occurred while processing the request" },
                { status: backendResponse.status }
            );
        }

        const responseData = await backendResponse.json();

        if (responseData.needTabular) {
            // 直接使用JSON数据，不需要解析CSV
            const { column_names: columnNames, row_count: rowCount } = responseData.calculationResult.stats;
            const rows = responseData.calculationResult.data; // 直接使用JSON数组数据

            // 确定列格式
            const columnFormats = columnNames.reduce((formats: Record<string, DataFormat>, colName: string) => {
                // 检查第一个非空值来确定类型
                const firstValue = rows.find(row => row[colName])?.[colName];

                if (!firstValue) {
                    formats[colName] = 'text';
                    return formats;
                }

                // 尝试转换为数字来检查是否为数值类型
                const numericValue = Number(firstValue);

                if (isNaN(numericValue)) {
                    formats[colName] = 'text';
                } else {
                    formats[colName] = String(firstValue).includes('%') ? 'percentage' : 'number';
                }

                return formats;
            }, {});

            // 创建列定义
            const columns: ColumnDefinition[] = columnNames.map(name => ({
                key: name,
                label: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
                format: columnFormats[name]
            }));

            // 创建表格配置
            const chartConfig: ChartConfig = columnNames.reduce((config: ChartConfig, colName: string) => {
                config[colName] = {
                    label: colName.charAt(0).toUpperCase() + colName.slice(1).replace(/_/g, ' '),
                    align: columnFormats[colName] === 'text' ? 'left' : 'right'
                };
                return config;
            }, {});

            // 创建表格数据结构
            responseData.chartData = {
                chartType: "tabular",
                config: {
                    title: "Data Table View",
                    description: `Showing ${rowCount} records`,
                    columns: columns
                },
                data: rows,
                chartConfig: chartConfig
            };
        }

        console.log("✅ Backend API Response received:", {
            status: "success",
            hasToolUse: !!responseData.chartData,
            hasChartData: !!responseData.chartData,
        });

        return NextResponse.json(responseData, {
            headers: {
                "Cache-Control": "no-cache",
            },
        });

    } catch (error) {
        console.error("❌ Agent API Error: ", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "An unknown error occurred",
            },
            { status: 500 }
        );
    }
}
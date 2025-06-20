// supabase/functions/custom-ai-agent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "npm:@google/generative-ai@^0.11.0";
// --- CLIENTS SETUP ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
if (!supabaseUrl) throw new Error("SUPABASE_URL is not set");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
if (!supabaseAnonKey) throw new Error("SUPABASE_ANON_KEY is not set");
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
if (!geminiApiKey) throw new Error("GEMINI_API_KEY is not set");
const genAI = new GoogleGenerativeAI(geminiApiKey);
const perplexityApiKey = Deno.env.get("PPLX_API_KEY");
const stabilityApiKey = Deno.env.get("STABILITY_API_KEY");
// --- SAFETY SETTINGS ---
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  }
];
// --- SYSTEM INSTRUCTIONS ---
const classicSystemInstruction = {
  role: "system",
  parts: [
    {
      text: `
    You are 'Classic AI', an expert business analyst and assistant for 'Classic Offset', a printing press.
    Your goal is to provide deep, actionable insights and assist the user by analyzing their business data using the tools provided.
    You must follow these rules strictly and in this exact order:

    RULE 1 (TOOL USE STRATEGY):
    - First, analyze the user's query. If it's about internal business data (customers, orders, financials), use your specialized data tools.
    - If the user asks for a "dashboard", "summary", "overview", or "key metrics", you SHOULD use the 'getDashboardMetrics' tool.
    - If the query is a general knowledge question, asks for real-time information (like today's date), or is something your internal tools cannot answer, you MUST use the 'performWebSearch' tool.
    - If a time-related query like "last week" is asked, use 'performWebSearch' to get "today's date" first to ensure your calculations are accurate.

    RULE 2 (SPECIFIC TOOL PRIORITY): Always use the MOST specific data tool available for business data.
    - To 'list' new customers, use 'listNewCustomers'.
    - For a 'count' of new customers, use 'getNewCustomerCount'.
    - For a 'financial report', use 'getFinancialReport'.

    RULE 3 (CONTEXT AWARENESS): Remember information from previous turns. If you've found a 'customer_id', reuse it. DO NOT ask for it again.

    RULE 4 (TOOL CHAINING): If a tool needs an ID you don't have, use another tool to find it first.

    RULE 5 (RESPONSE FORMATTING): Format your responses as professional Markdown reports with headings, bold text, lists, tables, and emojis (✨, 📊, 📈).

    RULE 6 (LANGUAGE): If the user asks in Tamil, respond in Tamil.

    RULE 7 (NO JARGON): NEVER mention 'JSON', 'API', etc.

    RULE 8 (NO APOLOGIES): Under no circumstances should you ever state that you "cannot access real-time information" or "do not have access to the latest news." If a query falls outside the scope of the internal data tools, you MUST use the 'performWebSearch' tool. There are no exceptions to this rule.
  `
    }
  ]
};
// --- TOOLS DEFINITION ---
const classicTools = [
  {
    functionDeclarations: [
      {
        name: "getDashboardMetrics",
        description: "Retrieves a summary of key business metrics like revenue, customers, orders, and dues. Use this for a general overview.",
        parameters: {
          "type": "OBJECT",
          "properties": {}
        }
      },
      {
        name: "performWebSearch",
        description: "Use for general knowledge questions, real-time information (like today's date), or any query that cannot be answered by the internal business data tools.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "query": {
              "type": "STRING"
            }
          },
          required: [
            "query"
          ]
        }
      },
      {
        name: "listNewCustomers",
        description: "Lists the full details of new customers acquired within a specific date range.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "start_date": {
              "type": "STRING"
            },
            "end_date": {
              "type": "STRING"
            }
          },
          "required": [
            "start_date",
            "end_date"
          ]
        }
      },
      {
        name: "getNewCustomerCount",
        description: "Gets ONLY the number/count of new customers in a date range.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "start_date": {
              "type": "STRING"
            },
            "end_date": {
              "type": "STRING"
            }
          },
          "required": [
            "start_date",
            "end_date"
          ]
        }
      },
      {
        name: "getFinancialReport",
        description: "Use this for any request about financials (revenue, expenses, profit) within a date range.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "start_date": {
              "type": "STRING"
            },
            "end_date": {
              "type": "STRING"
            }
          },
          "required": [
            "start_date",
            "end_date"
          ]
        }
      },
      {
        name: "getCustomerDetails",
        description: "Get customer details by name.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "customer_name": {
              "type": "STRING"
            }
          },
          "required": [
            "customer_name"
          ]
        }
      },
      {
        name: "getSingleOrderDetails",
        description: "Get single order details by order ID.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "order_id": {
              "type": "NUMBER"
            }
          },
          "required": [
            "order_id"
          ]
        }
      },
      {
        name: "getOrdersForCustomer",
        description: "Get all orders for a customer by ID.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "customer_id": {
              "type": "STRING"
            }
          },
          "required": [
            "customer_id"
          ]
        }
      },
      {
        name: "getPaymentsForCustomer",
        description: "Get all payments for a customer by ID.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "customer_id": {
              "type": "STRING"
            }
          },
          "required": [
            "customer_id"
          ]
        }
      },
      {
        name: "getFinancialSummary",
        description: "Get financial summary for a month (YYYY-MM-DD).",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "month": {
              "type": "STRING"
            }
          },
          "required": [
            "month"
          ]
        }
      },
      {
        name: "getRecentDuePayments",
        description: "Get recent due payments.",
        parameters: {
          "type": "OBJECT",
          "properties": {}
        }
      },
      {
        name: "getLowStockMaterials",
        description: "Get low stock materials.",
        parameters: {
          "type": "OBJECT",
          "properties": {}
        }
      },
      {
        name: "getTopSpendingCustomers",
        description: "Get top spending customers.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "limit": {
              "type": "NUMBER"
            }
          },
          "required": [
            "limit"
          ]
        }
      },
      {
        name: "getEmployeePerformance",
        description: "Get employee performance by name.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "employee_name": {
              "type": "STRING"
            }
          },
          "required": [
            "employee_name"
          ]
        }
      },
      {
        name: "getBestSellingProducts",
        description: "Get best selling products.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "limit": {
              "type": "NUMBER"
            }
          },
          "required": [
            "limit"
          ]
        }
      },
      {
        name: "createNewCustomer",
        description: "Create a new customer.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "name": {
              "type": "STRING"
            },
            "phone": {
              "type": "STRING"
            },
            "address": {
              "type": "STRING"
            }
          },
          "required": [
            "name",
            "phone"
          ]
        }
      },
      {
        name: "logNewExpense",
        description: "Log a new expense.",
        parameters: {
          "type": "OBJECT",
          "properties": {
            "expense_type": {
              "type": "STRING"
            },
            "amount": {
              "type": "NUMBER"
            },
            "paid_to": {
              "type": "STRING"
            }
          },
          "required": [
            "expense_type",
            "amount",
            "paid_to"
          ]
        }
      }
    ]
  }
];
async function performPerplexitySearch(query) {
  if (!perplexityApiKey) return "Error: PPLX_API_KEY not configured.";
  const requestBody = {
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: "You are a web search API. Provide a direct, factual, and concise answer."
      },
      {
        role: 'user',
        content: query
      }
    ]
  };
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      return `Perplexity API Error (${response.status}): ${errorText}`;
    }
    const data = await response.json();
    return data.choices[0]?.message?.content || "No information found.";
  } catch (error) {
    return `Failed to connect to Perplexity API: ${error.message}`;
  }
}
serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
    }
  });
  try {
    const { history } = await req.json();
    if (!history) return new Response(JSON.stringify({
      error: "History is required."
    }), {
      status: 400
    });
    const userToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userToken) return new Response(JSON.stringify({
      error: "Authorization required."
    }), {
      status: 401
    });
    const { data: { user } } = await supabase.auth.getUser(userToken);
    if (!user) return new Response(JSON.stringify({
      error: "Invalid user token."
    }), {
      status: 401
    });
    const latestUserMessage = history[history.length - 1]?.parts[0]?.text;
    if (!latestUserMessage) return new Response(JSON.stringify({
      error: "User message is missing."
    }), {
      status: 400
    });
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      tools: classicTools,
      systemInstruction: classicSystemInstruction,
      safetySettings
    });
    const chat = model.startChat({
      history: history.slice(0, -1)
    });
    let result = await chat.sendMessage(latestUserMessage);
    for(let i = 0; i < 5; i++){
      const functionCalls = result.response.functionCalls();
      if (!functionCalls || functionCalls.length === 0) break;
      const call = functionCalls[0];
      let toolResponseContent;
      console.log(`[LOG] AI wants to call: ${call.name} with args: ${JSON.stringify(call.args)}`);
      try {
        if (call.name === "getDashboardMetrics") {
          const { data, error } = await supabase.rpc('get_dashboard_metrics');
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data);
        } else if (call.name === "performWebSearch") {
          toolResponseContent = await performPerplexitySearch(call.args.query);
        } else if (call.name === "listNewCustomers") {
          const { data, error } = await supabase.rpc('list_new_customers_by_date', {
            start_date: call.args.start_date,
            end_date: call.args.end_date
          });
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data);
        } else if (call.name === "getNewCustomerCount") {
          const { data, error } = await supabase.rpc('get_new_customer_count', {
            start_date: call.args.start_date,
            end_date: call.args.end_date
          });
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data);
        } else if (call.name === "getFinancialReport") {
          const { data, error } = await supabase.rpc('get_financial_report_for_period', {
            start_date: call.args.start_date,
            end_date: call.args.end_date
          });
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data);
        } else if (call.name === "getCustomerDetails") {
          const { data, error } = await supabase.from("customers").select().ilike("name", `%${call.args.customer_name}%`);
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
        } else if (call.name === "getSingleOrderDetails") {
          const { data, error } = await supabase.rpc('get_order_details_with_status', {
            p_order_id: call.args.order_id
          });
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
        } else if (call.name === "getOrdersForCustomer") {
          const { data, error } = await supabase.from("orders").select().eq("customer_id", call.args.customer_id);
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
        } else if (call.name === "getPaymentsForCustomer") {
          const { data, error } = await supabase.from("payments").select().eq("customer_id", call.args.customer_id);
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
        } else if (call.name === "getFinancialSummary") {
          const { data, error } = await supabase.rpc('get_financial_summary', {
            p_month: call.args.month
          });
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
        } else if (call.name === "getRecentDuePayments") {
          const { data, error } = await supabase.rpc('get_recent_due_payments');
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
        } else if (call.name === "getLowStockMaterials") {
          const { data, error } = await supabase.rpc('get_low_stock_materials');
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
        } else if (call.name === "getTopSpendingCustomers") {
          const { data, error } = await supabase.rpc('get_top_spending_customers', {
            p_limit: call.args.limit
          });
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
        } else if (call.name === "getEmployeePerformance") {
          const { data, error } = await supabase.rpc('get_employee_performance', {
            p_employee_name: call.args.employee_name
          });
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
        } else if (call.name === "getBestSellingProducts") {
          const { data, error } = await supabase.rpc('get_best_selling_products', {
            p_limit: call.args.limit
          });
          toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
        } else if (call.name === "createNewCustomer") {
          const { name, phone, address } = call.args;
          const { data, error } = await supabase.from('customers').insert([
            {
              name,
              phone,
              address
            }
          ]).select();
          toolResponseContent = error ? `DB Error: ${error.message}` : `Successfully created new customer: ${JSON.stringify(data)}`;
        } else if (call.name === "logNewExpense") {
          const { expense_type, amount, paid_to } = call.args;
          const { data, error } = await supabase.from('expenses').insert([
            {
              date: new Date(),
              expense_type,
              amount,
              paid_to
            }
          ]).select();
          toolResponseContent = error ? `DB Error: ${error.message}` : `Successfully logged new expense: ${JSON.stringify(data)}`;
        } else {
          toolResponseContent = `Unknown function call: ${call.name}`;
        }
      } catch (e) {
        console.error(`[ERROR] Tool ${call.name} failed:`, e.message);
        toolResponseContent = `Error: The function '${call.name}' failed.`;
      }
      result = await chat.sendMessage(JSON.stringify({
        functionResponse: {
          name: call.name,
          response: {
            content: toolResponseContent
          }
        }
      }));
    }
    return new Response(JSON.stringify({
      response: result.response.text()
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("Main server error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});

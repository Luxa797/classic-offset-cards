// supabase/functions/custom-ai-agent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.11.0"; 

// --- CLIENTS SETUP ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
if (!supabaseUrl) throw new Error("SUPABASE_URL is not set");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
if (!supabaseAnonKey) throw new Error("SUPABASE_ANON_KEY is not set");
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
if (!geminiApiKey) throw new Error("GEMINI_API_KEY is not set");
const genAI = new GoogleGenerativeAI(geminiApiKey);

// --- SYSTEM INSTRUCTION (UPGRADED) ---
const systemInstruction = {
  role: "system",
  parts: [{ text: `
    You are an expert assistant for a printing press shop. 
    Your primary goal is to help the user by answering their questions using the available tools.
    You must follow these rules strictly:

    RULE 1: If a user asks for details like orders or payments using a customer's NAME, 
    but the required tool needs a customer_id, you MUST follow this two-step process:
    1. First, use the 'getCustomerDetails' tool to find the customer's ID using their name.
    2. Then, once you have the customer_id, use the appropriate tool 
       ('getOrdersForCustomer' or 'getPaymentsForCustomer') to fulfill the original request.
    Do not ask the user for the ID; find it yourself.

    RULE 2: If a user provides an ORDER NUMBER and asks for related details (like payment or customer info),
    you MUST follow this two-step process:
    1. First, use the 'getSingleOrderDetails' tool with the provided order number. This tool will give you the 'customer_id'.
    2. Then, use that 'customer_id' to call other tools like 'getPaymentsForCustomer' or 'getCustomerDetails' to get the extra information requested.
    Do not ask the user for the customer ID; find it yourself using the order number.
  `}],
};

// --- TOOLS DEFINITION (COMPLETE) ---
const tools = [
  {
    functionDeclarations: [
      { name: "getCustomerDetails", description: "Get details for a specific customer by their name.", parameters: { type: "OBJECT", properties: { "customer_name": { type: "STRING" } }, required: ["customer_name"] } },
      { name: "getSingleOrderDetails", description: "Get the full details for a single, specific order by its order number (ID). This tool returns the customer_id associated with the order.", parameters: { type: "OBJECT", properties: { "order_id": { type: "NUMBER" } }, required: ["order_id"] } },
      { name: "getOrdersForCustomer", description: "Get all orders for a specific customer by their customer ID.", parameters: { type: "OBJECT", properties: { "customer_id": { type: "STRING" } }, required: ["customer_id"] } },
      { name: "getPaymentsForCustomer", description: "Get all payment records for a specific customer by their customer ID.", parameters: { type: "OBJECT", properties: { "customer_id": { type: "STRING" } }, required: ["customer_id"] } },
      { name: "getFinancialSummary", description: "Get a summary of total revenue, expenses, and net profit for a given month.", parameters: { type: "OBJECT", properties: { "month": { type: "STRING", description: "The month in YYYY-MM-DD format (e.g., 2025-06-01)" } }, required: ["month"] } },
      { name: "getRecentDuePayments", description: "Get a list of all payments that are currently due or partially paid.", parameters: { type: "OBJECT", properties: {} } },
      { name: "getLowStockMaterials", description: "Get a list of all materials where the current quantity is at or below the minimum stock level.", parameters: { type: "OBJECT", properties: {} } }
    ]
  }
];

// --- MAIN SERVER LOGIC (COMPLETE) ---
serve(async (req) => {
  if (req.method === "OPTIONS") { return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } }); }

  try {
    const { prompt } = await req.json();
    if (!prompt) { return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400 }); }
    
    const userToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userToken) { return new Response(JSON.stringify({ error: "Authorization header required" }), { status: 401 }); }
    const { data: { user } } = await supabase.auth.getUser(userToken);
    if (!user) { return new Response(JSON.stringify({ error: "Invalid user token" }), { status: 401 }); }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", tools, systemInstruction });
    const chat = model.startChat();
    let result = await chat.sendMessage(prompt);

    for (let i = 0; i < 5; i++) {
        const functionCalls = result.response.functionCalls();
        if (!functionCalls || functionCalls.length === 0) { break; }

        const call = functionCalls[0];
        console.log(`AI wants to call a function: ${call.name}`);
        let toolResponseContent;

        if (call.name === "getCustomerDetails") {
            const { data, error } = await supabase.from("customers").select().ilike("name", `%${call.args.customer_name}%`);
            if (error) throw new Error(`DB Error (customers): ${error.message}`);
            toolResponseContent = !data || data.length === 0 ? `No customer named "${call.args.customer_name}" found.` : JSON.stringify(data);
        } else if (call.name === "getSingleOrderDetails") {
            const { data, error } = await supabase.rpc('get_order_details_with_status', { p_order_id: call.args.order_id });
            if (error) throw new Error(`DB Error (single order): ${error.message}`);
            toolResponseContent = !data ? `No order found with ID ${call.args.order_id}.` : JSON.stringify(data);
        } else if (call.name === "getOrdersForCustomer") {
            const { data, error } = await supabase.from("orders").select().eq("customer_id", call.args.customer_id);
            if (error) throw new Error(`DB Error (orders): ${error.message}`);
            toolResponseContent = !data || data.length === 0 ? `No orders found for customer ID ${call.args.customer_id}.` : JSON.stringify(data);
        } else if (call.name === "getPaymentsForCustomer") {
            const { data, error } = await supabase.from("payments").select().eq("customer_id", call.args.customer_id);
            if (error) throw new Error(`DB Error (payments): ${error.message}`);
            toolResponseContent = !data || data.length === 0 ? `No payments found for customer ID ${call.args.customer_id}.` : JSON.stringify(data);
        } else if (call.name === "getFinancialSummary") {
            const { data, error } = await supabase.rpc('get_financial_summary', { p_month: call.args.month });
            if (error) throw new Error(`DB Error (financial summary): ${error.message}`);
            toolResponseContent = JSON.stringify(data);
        } else if (call.name === "getRecentDuePayments") {
            const { data, error } = await supabase.rpc('get_recent_due_payments');
            if (error) throw new Error(`DB Error (due payments): ${error.message}`);
            toolResponseContent = !data || data.length === 0 ? "No due payments found." : JSON.stringify(data);
        } else if (call.name === "getLowStockMaterials") {
            const { data, error } = await supabase.rpc('get_low_stock_materials');
            if (error) throw new Error(`DB Error (low stock): ${error.message}`);
            toolResponseContent = !data || data.length === 0 ? "All materials are above minimum stock levels." : JSON.stringify(data);
        } else {
            throw new Error(`Unknown function call: ${call.name}`);
        }

        result = await chat.sendMessage(JSON.stringify({
            functionResponse: { name: call.name, response: { content: toolResponseContent } },
        }));
    }

    return new Response(JSON.stringify({ response: result.response.text() }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
});

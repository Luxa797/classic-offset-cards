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
const safetySettings = [ { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }, { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }, { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }, { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE } ];

// --- SYSTEM INSTRUCTIONS ---
// --- RESTORED DETAILED INSTRUCTIONS FOR CLASSIC AGENT ---
const classicSystemInstruction = { 
  role: "system", 
  parts: [{ text: `
    You are an expert assistant for a printing press shop named 'Classic Offset'. 
    Your primary goal is to help the user by answering their questions using the available tools.
    You must follow these rules strictly:
    
    RULE 1: If a user asks for details like orders or payments using a customer's NAME, 
    but the required tool needs a customer_id, you MUST follow this two-step process:
    1. First, use the 'getCustomerDetails' tool to find the customer's ID using their name.
    2. Then, once you have the customer_id, use the appropriate tool (like getOrdersForCustomer or getPaymentsForCustomer) to fulfill the original request.
    
    RULE 2: If a user provides an ORDER NUMBER and asks for related details (like payment or customer info),
    you MUST follow this two-step process:
    1. First, use the 'getSingleOrderDetails' tool with the provided order number. This tool will give you the 'customer_id'.
    2. Then, use that 'customer_id' to call other tools to get the extra information requested.
    
    Do not ask the user for the ID; find it yourself. If you find multiple customers with the same name, ask the user for clarification.
    
    RULE 3: If the user asks a question in Tamil, you MUST respond in Tamil.
  ` }]
};
const imageCreatorSystemInstruction = { role: "system", parts: [{ text: "You are an image generation assistant. Use the 'createImage' tool. When you get the image data back from the tool, just say 'Here is the image you requested:' followed by the data." }]};

// --- TOOLS DEFINITION ---
const classicTools = [{ functionDeclarations: [ { name: "getCustomerDetails", description: "Get customer details by name.", parameters: { type: "OBJECT", properties: { "customer_name": { type: "STRING" } }, required: ["customer_name"] } }, { name: "getSingleOrderDetails", description: "Get single order details by order ID.", parameters: { type: "OBJECT", properties: { "order_id": { type: "NUMBER" } }, required: ["order_id"] } }, { name: "getOrdersForCustomer", description: "Get all orders for a customer by ID.", parameters: { type: "OBJECT", properties: { "customer_id": { type: "STRING" } }, required: ["customer_id"] } }, { name: "getPaymentsForCustomer", description: "Get all payments for a customer by ID.", parameters: { type: "OBJECT", properties: { "customer_id": { type: "STRING" } }, required: ["customer_id"] } }, { name: "getFinancialSummary", description: "Get financial summary for a month (YYYY-MM-DD).", parameters: { type: "OBJECT", properties: { "month": { type: "STRING" } }, required: ["month"] } }, { name: "getRecentDuePayments", description: "Get recent due payments.", parameters: { type: "OBJECT", properties: {} } }, { name: "getLowStockMaterials", description: "Get low stock materials.", parameters: { type: "OBJECT", properties: {} } }, { name: "getTopSpendingCustomers", description: "Get top spending customers.", parameters: { type: "OBJECT", properties: { "limit": { type: "NUMBER" } }, required: ["limit"] } }, { name: "getEmployeePerformance", description: "Get employee performance by name.", parameters: { type: "OBJECT", properties: { "employee_name": { type: "STRING" } }, required: ["employee_name"] } }, { name: "getBestSellingProducts", description: "Get best selling products.", parameters: { type: "OBJECT", properties: { "limit": { type: "NUMBER" } }, required: ["limit"] } }, { name: "createNewCustomer", description: "Create a new customer.", parameters: { type: "OBJECT", properties: { "name": { type: "STRING" }, "phone": { type: "STRING" }, "address": { type: "STRING" } }, required: ["name", "phone"] } }, { name: "logNewExpense", description: "Log a new expense.", parameters: { type: "OBJECT", properties: { "expense_type": { type: "STRING" }, "amount": { type: "NUMBER" }, "paid_to": { type: "STRING" } }, required: ["expense_type", "amount", "paid_to"] } } ] }];
const imageCreatorTool = [{ functionDeclarations: [{ name: "createImage", description: "Creates a photorealistic image based on a detailed textual description.", parameters: { type: "OBJECT", properties: { "prompt": { type: "STRING" } }, required: ["prompt"] } }] }];

async function performPerplexitySearch(query: string): Promise<string> {
    if (!perplexityApiKey) return "Error: PPLX_API_KEY not configured.";
    const requestBody = { model: 'sonar', messages: [ { role: 'system', content: "You are a web search API. Provide a direct, factual, and concise answer." }, { role: 'user', content: query } ] };
    try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${perplexityApiKey}` }, body: JSON.stringify(requestBody) });
        if (!response.ok) { const errorText = await response.text(); return `Perplexity API Error (${response.status}): ${errorText}`; }
        const data = await response.json();
        return data.choices[0]?.message?.content || "No information found.";
    } catch (error) { return `Failed to connect to Perplexity API: ${error.message}`; }
}

async function generateStableImage(prompt: string): Promise<string> {
    if (!stabilityApiKey) {
        return "பிழை: STABILITY_API_KEY சேமிக்கப்படவில்லை. தயவுசெய்து Supabase திட்டத்தின் Secrets பகுதியில் உங்கள் API சாவியைச் சேர்க்கவும்.";
    }
    const engineId = "stable-diffusion-v1-6";
    const apiHost = "https://api.stability.ai";
    try {
        const response = await fetch(`${apiHost}/v1/generation/${engineId}/text-to-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${stabilityApiKey}` },
            body: JSON.stringify({ text_prompts: [{ text: prompt }], cfg_scale: 7, height: 512, width: 512, steps: 30, samples: 1 }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Stability API Error! Status: ${response.status}, Body: ${errorText}`);
            return `படத்தை உருவாக்க முடியவில்லை. Stability API-யிலிருந்து பிழை: HTTP ஸ்டேட்டஸ் ${response.status}. உங்கள் 'STABILITY_API_KEY' சரியாக உள்ளதா என்பதை மீண்டும் சரிபார்க்கவும்.`;
        }
        const responseJSON = await response.json();
        const imageBase64 = responseJSON.artifacts[0].base64;
        return `data:image/png;base64,${imageBase64}`;
    } catch (error) {
        console.error("Fetch to Stability AI failed:", error);
        return `பிழை: Stability AI API-ஐ இணைப்பதில் சிக்கல். ${error.message}`;
    }
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  try {
    const { history, agentType } = await req.json();
    if (!history || !agentType) return new Response(JSON.stringify({ error: "History and agentType are required." }), { status: 400 });

    const userToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userToken) return new Response(JSON.stringify({ error: "Authorization required." }), { status: 401 });
    const { data: { user } } = await supabase.auth.getUser(userToken);
    if (!user) return new Response(JSON.stringify({ error: "Invalid user token." }), { status: 401 });

    const latestUserMessage = history[history.length - 1]?.parts[0]?.text;
    if (!latestUserMessage) return new Response(JSON.stringify({ error: "User message is missing." }), { status: 400 });

    if (agentType === 'web') {
        const searchResult = await performPerplexitySearch(latestUserMessage);
        return new Response(JSON.stringify({ response: searchResult }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }

    let tools, systemInstruction;
    if (agentType === 'image') {
        tools = imageCreatorTool;
        systemInstruction = imageCreatorSystemInstruction;
    } else {
        tools = classicTools;
        systemInstruction = classicSystemInstruction;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", tools, systemInstruction, safetySettings });
    const chat = model.startChat({ history: history.slice(0, -1) });
    let result = await chat.sendMessage(latestUserMessage);

    for (let i = 0; i < 5; i++) {
        const functionCalls = result.response.functionCalls();
        if (!functionCalls || functionCalls.length === 0) break;
        const call = functionCalls[0];
        let toolResponseContent;
        
        if (call.name === "createImage") {
            toolResponseContent = await generateStableImage(call.args.prompt);
        } else {
            // ... (Full classic tools logic)
            if (call.name === "getCustomerDetails") {
                const { data, error } = await supabase.from("customers").select().ilike("name", `%${call.args.customer_name}%`);
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            } else if (call.name === "getSingleOrderDetails") {
                const { data, error } = await supabase.rpc('get_order_details_with_status', { p_order_id: call.args.order_id });
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            } else if (call.name === "getOrdersForCustomer") {
                const { data, error } = await supabase.from("orders").select().eq("customer_id", call.args.customer_id);
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            } else if (call.name === "getPaymentsForCustomer") {
                const { data, error } = await supabase.from("payments").select().eq("customer_id", call.args.customer_id);
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            } else if (call.name === "getFinancialSummary") {
                const { data, error } = await supabase.rpc('get_financial_summary', { p_month: call.args.month });
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            } else if (call.name === "getRecentDuePayments") {
                const { data, error } = await supabase.rpc('get_recent_due_payments');
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            } else if (call.name === "getLowStockMaterials") {
                const { data, error } = await supabase.rpc('get_low_stock_materials');
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            } else if (call.name === "getTopSpendingCustomers") {
                const { data, error } = await supabase.rpc('get_top_spending_customers', { p_limit: call.args.limit });
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            } else if (call.name === "getEmployeePerformance") {
                const { data, error } = await supabase.rpc('get_employee_performance', { p_employee_name: call.args.employee_name });
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            } else if (call.name === "getBestSellingProducts") {
                const { data, error } = await supabase.rpc('get_best_selling_products', { p_limit: call.args.limit });
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            } else if (call.name === "createNewCustomer") {
                const { name, phone, address } = call.args;
                const { data, error } = await supabase.from('customers').insert([{ name, phone, address }]).select();
                toolResponseContent = error ? `DB Error: ${error.message}` : `Successfully created new customer: ${JSON.stringify(data)}`;
            } else if (call.name === "logNewExpense") {
                const { expense_type, amount, paid_to } = call.args;
                const { data, error } = await supabase.from('expenses').insert([{ date: new Date(), expense_type, amount, paid_to }]).select();
                toolResponseContent = error ? `DB Error: ${error.message}` : `Successfully logged new expense: ${JSON.stringify(data)}`;
            } else {
                 toolResponseContent = `Unknown function call: ${call.name}`;
            }
        }
        
        result = await chat.sendMessage(JSON.stringify({ functionResponse: { name: call.name, response: { content: toolResponseContent } } }));
    }

    return new Response(JSON.stringify({ response: result.response.text() }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    console.error("Main server error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
});

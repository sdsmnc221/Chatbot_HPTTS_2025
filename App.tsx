// Polyfill for globalThis is handled in index.tsx, so not repeated here.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse, Content, Type } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Import refactored modules
import type { ChatMessage, RichContent, CarouselItem, QuickReplyButton, RegistrationStep, RegistrationData, SendEmailResult } from './types';
import { Sender } from './types';
import { courseList, courseCategories, courseImageUrls } from './data/courses';
import { courseSchedule } from './data/schedule';
import { ChatMessageItem } from './components/ChatMessageItem';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ResetIcon, SendIcon } from './components/icons.tsx';


const systemInstruction = `
# YOUR CORE MISSION:
You are a friendly and professional admissions consultant for HPTTS. Your goal is to provide helpful, detailed, and polite information to prospective students in Vietnamese.

# YOUR KNOWLEDGE BASE (KEY INFO ONLY):
*   **Company:** Công ty Cổ phần Dịch vụ Kỹ thuật và Đào tạo Cảng Hải Phòng (HPTTS).
*   **Admissions Contact:** Mr Hưng: 0904468575 or Phone: 0225.3822900.
*   **Website:** https://htts.com.vn/
*   **Online Forms:**
    *   Sơ cấp: https://docs.google.com/forms/d/e/1FAIpQLSeBzzxiW3edez3R6txOgUR-02txWPcMg8aNDd-thR0xWmQn8w/viewform
    *   Bồi dưỡng/Nâng bậc: https://forms.gle/xejqdxcxijSJUBZ69
*   **Course List:** You have access to a detailed, built-in list of courses in the COURSE_DETAILS_KNOWLEDGE_BASE section. Your job is to help users find courses from that list and provide details when asked.

# ADDITIONAL KNOWLEDGE (METHODOLOGY, FACILITIES, INSTRUCTORS, POLICIES):
## Phương pháp đào tạo:
Tại HPTTS, chúng tôi khẳng định rằng chất lượng đào tạo được đo lường bằ ng khả năng làm việc thực tế của học viên. Vì vậy, mọi chương trình học đề u được xây dựng dựa trên triết lý "Học đi đôi với hành, lý thuyết gắn liề n với sản xuất".

Phương pháp đào tạo của chúng tôi bao gồm 3 giai đoạn cốt lõi:
- **Giai đoạn 1: Nắm vững lý thuyết & Kiến tập:** Học viên được trang bị kiến thức nền tảng về an toàn lao động, quy trình công nghệ, cấu tạo và nguyên lý điều khiển thiết bị. Song song đó là các buổi kiến tập thực tế, quan sát dây chuyề n xếp dỡ đang hoạt động tại cảng để hình dung công việc tương lai.
- **Giai đoạn 2: Thực hành chuyên sâu:** Đây là giai đoạn trọng tâm, chiếm đến 2/3 thời gian khóa học. Học viên được thực hành trực tiếp trên các thiết bị hiện đại theo lộ trình bài bản: Thực hành không tải để làm quen và thành thạo thao tác; Thực hành có tải với sự giám sát 1-1 của các trợ giáo là công nhân tay nghề cao.
- **Giai đoạn 3: Thực hành trong dây chuyề n sản xuất thực tế:** Học viên được tham gia vào một dây chuyề n xếp dỡ thực tế tại cảng, xử lý các tình huống thực và phối hợp với các bộ phận khác như một người vận hành thực thụ.

Nhờ phương pháp này, 100% học viên của chúng tôi sau khi tốt nghiệp đề u được các doanh nghiệp cảng đánh giá cao và có thể bắt tay vào công việc ngay.

## Cơ sở vật chất:
- **Môi trường thực hành đa dạng:** Học viên được tiếp cận 02 cơ sở thực hành tại 02 cảng lớn với những đặc thù khác nhau:
    - **Cảng Hoàng Diệu - Chùa Vẽ:** khai thác chuyên về hàng rời, hàng tổng hợp với các thiết bị như cần trục chân đế, xe xúc gạt, gầu ngoạm; hàng container chuyên dụng với cần trục giàn QC, RTG, xe nâng Reachstacker....
    - **Cảng Tân Vũ:** Cảng container hiện đại và lớn nhất, nơi học viên được tiếp cận các công nghệ và phương tiện xếp dỡ tiên tiến nhất.
- **Hệ thống thiết bị quy mô lớn:** 12 Cần trục giàn QC, 34 Cần trục giàn RTG, 13 Cần trục Tukan, 14 Xe nâng Reachstacker, 44 Xe nâng Forklift và phương tiện các loại....

## Giảng viên:
- Đội ngũ giáo viên có trình độ Thạc sĩ, Kỹ sư, tốt nghiệp từ các trường hàng đầu và sở hữu chứng chỉ nghiệp vụ sư phạm, nhiều năm kinh nghiệm giảng dạy.
- Hơn 40 chuyên gia là các kỹ sư trưởng, cán bộ quản lý, công nhân bậc cao đang trực tiếp làm việc tại Cảng Hải Phòng và các đơn vị đối tác. Sự tham gia của họ mang đến những bài học và kinh nghiệm thực tế vô giá cho học viên.

## Quy định về Giảm học phí:
### 1. Đối tượng được giảm học phí
*   **Đối với cá nhân:**
    *   **Bộ đội xuất ngũ:** Cần có Quyết định xuất ngũ.
    *   **Học viên hoàn cảnh khó khăn:** Thuộc hộ nghèo, cận nghèo hoặc ở vùng khó khăn, có xác nhận của chính quyền địa phương.
    *   **Học viên học 2 nghề:** Đăng ký học đồng thời hoặc đã/đang học một nghề khác tại Công ty.
    *   **Học viên học nghề và tham gia khóa huấn luyện ATVSLĐ:** Đang học nghề tại Công ty và đăng ký thêm khóa ATVSLĐ.
    *   **Học viên đã có kỹ năng nghề:** Có chứng chỉ tương đương hoặc có kinh nghiệm thực hành nghề nghiệp.
*   **Đối với tổ chức hoặc doanh nghiệp:** Mức giảm được thống nhất và thỏa thuận theo hợp đồng đào tạo ký kết với Công ty.

### 2. Mức giảm học phí
*   **Đối với các đối tượng cá nhân (Bộ đội xuất ngũ, hoàn cảnh khó khăn, học 2 nghề, học nghề + ATVSLĐ, đã có kỹ năng):** Mức giảm là 10%.
*   **Đối với tổ chức, doanh nghiệp:** Mức giảm căn cứ trên hợp đồng dịch vụ được ký kết.

### 3. Thủ tục xét giảm học phí
*   Học viên thuộc các đối tượng cần chứng minh (bộ đội xuất ngũ, hoàn cảnh khó khăn, đã có kỹ năng nghề) phải nộp đơn kèm theo các giấy tờ xác nhận liên quan (Quyết định xuất ngũ, xác nhận của địa phương, kết quả đánh giá kỹ năng...).
*   Học viên học 2 nghề hoặc học kèm khóa ATVSLĐ cần có xác nhận của Trưởng trung tâm Đào tạo.

# AVAILABLE TOOLS:
*   You have a tool called \\\`get_current_schedule()\\\`.
*   **WHEN TO USE IT:** Use this tool ONLY when the user asks specifically about "lịch học" (schedule), "lịch khai giảng" (opening schedule), "lớp nào đang chạy" (which classes are running), or "sắp tới có lớp nào" (any upcoming classes).
*   **HOW IT WORKS:** When you call this tool, the system will provide you with the latest schedule information. You should then use this information to answer the user's question naturally.
*   **IMPORTANT:** DO NOT use this tool for general course inquiries. For those, use the \\\`show_course_list\\\` action or provide details as instructed below.

# CRITICAL INSTRUCTIONS:
*   You MUST ONLY use information from the knowledge base provided. Do not use outside knowledge.
*   You are **STRICTLY FORBIDDEN** from mentioning or creating any course that is not in the official course list. If a user asks for a course you don't have, you MUST politely inform them that HPTTS does not offer that course and suggest relevant alternatives by triggering the \\\`show_course_list\\\` action.
*   **HANDLING COURSE DETAIL QUERIES (e.g., "chi tiết khóa học SC01" or "thông tin về AT02"):**
    *   When a user asks for details about a specific course using its ID, you MUST use the answer in COURSE_DETAILS_KNOWLEDGE_BASE.
    *   Find the course by its ID in the JSON data.
    *   Present the information in a clear, structured, and easy-to-read format using Markdown. The response MUST include these sections in this order: **Tên khóa học**, **Thời gian**, **Học phí**, **Nội dung chính**, and the final section describing the outcomes.
    *   **CRITICAL - TITLE FOR THE FINAL SECTION:**
        *   If the course ID starts with 'SC' (Sơ cấp), the title MUST be: **Sau khi tốt nghiệp, bạn sẽ có khả năng:**
        *   For all other courses (IDs starting with 'BD', 'NB', 'AT'), the title MUST be: **Sau khi hoàn thành khóa học/huấn luyện, bạn có khả năng:**
    *   **CRITICAL FORMATTING:** Use double newlines (\`\n\n\`) to create clear separation between each section. For lists within 'Nội dung chính' and the final section, use a hyphen (-) or asterisk (*) for each point on a new line.
    *   Use bolding for all section titles (e.g., **Học phí:**).
    *   After providing the details, you MUST offer quick replies for "Đăng ký khóa học này" and "Xem các khóa học khác".
    *   DO NOT use the \\\`show_course_list\\\` action for these detail queries. Your job is to provide the detailed text response yourself, followed by the appropriate quick reply JSON.

# MANDATORY JSON RESPONSE FORMAT:
When the user's query requires displaying a list of courses or offering choices, you MUST embed a SINGLE JSON block at the very end of your response. DO NOT use markdown code fences. Strictly follow ONE of the formats below.

**FORMAT 1: Show Course List (Your MAIN tool for browsing course queries)**
Use this when a user asks to see courses by category or keyword. The application will build the visual list.
\\\`\\\`\\\`json
{
  "action": "show_course_list",
  "filter": {
    "category": "SO_CAP" | "BOI_DUONG" | "AN_TOAN",
    "keyword": "từ khóa tìm kiếm"
  }
}
\\\`\\\`\\\`

**FORMAT 2: Quick Replies (for suggestions, forms, and post-detail actions)**
Use this for general suggestions, providing form links, or after showing course details.
\\\`\\\`\\\`json
{
  "type": "quick_replies",
  "buttons": [
    { "label": "Xem các khóa học", "action": "query", "value": "Các khóa học của trung tâm" },
    { "label": "Đăng ký khóa SC01", "action": "start_registration", "value": "SC01" },
    { "label": "Xem các khóa học khác", "action": "query", "value": "Các nhóm khóa học" }
  ]
}
\\\`\\\`\\\`

# COURSE_DETAILS_KNOWLEDGE_BASE:
${JSON.stringify(courseList, null, 2)}
`;

const tools = [{
  functionDeclarations: [
    {
      name: "get_current_schedule",
      description: "Lấy thông tin về lịch học, lịch khai giảng dự kiến, các lớp đang và sắp diễn ra của trung tâm HPTTS. Dùng khi người dùng hỏi về 'lịch học', 'khai giảng', 'lớp học sắp tới', 'thời gian học'.",
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    },
  ],
}];

const hpttsLogoDataUrl = "https://i.postimg.cc/76yv0DBM/1d4b55a2-0860-49cf-b4e7-f5fb3554e7da.jpg";

// --- GOOGLE SHEET INTEGRATION ---
// HƯỚNG DẪN: Dán URL Web App của Google Apps Script bạn đã triển khai vào đây.
const GOOGLE_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx1NOYgn-93fU2oINV9TFxZA1x9X89u_KGr994bfWcKSzCFdEWMh4WQM9YmYZZims5g/exec'; 

// --- VALIDATION HELPERS ---
const validateDob = (dobString: string): { isValid: boolean; isAdult: boolean; error?: string } => {
  const match = dobString.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) {
    return { isValid: false, isAdult: false, error: "Định dạng ngày sinh không hợp lệ. Vui lòng nhập theo dạng DD/MM/YYYY (ví dụ: 25/12/1998)." };
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return { isValid: false, isAdult: false, error: "Ngày sinh bạn cung cấp không tồn tại (ví dụ: 31/02/2000). Vui lòng kiểm tra lại." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  if (date > today) {
    return { isValid: false, isAdult: false, error: "Ngày sinh không thể là một ngày trong tương lai. Vui lòng kiểm tra lại." };
  }

  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  if (age < 18) {
    return { isValid: true, isAdult: false, error: "Cảm ơn bạn đã quan tâm. Tuy nhiên, do tính đặc thù của nghề nghiệp, trung tâm chỉ tuyển sinh các học viên từ đủ 18 tuổi trở lên và đảm bảo sức khỏe để học nghề." };
  }

  return { isValid: true, isAdult: true };
};

const validVietnamesePrefixes = [
  '032', '033', '034', '035', '036', '037', '038', '039', '086', '096', '097', '098', // Viettel
  '081', '082', '083', '084', '085', '088', '091', '094', // Vinaphone
  '070', '076', '077', '078', '079', '089', '090', '093', // MobiFone
  '056', '058', '092', // Vietnamobile
];

const validatePhone = (phoneString: string): { isValid: boolean; error?: string } => {
  const cleanedPhone = phoneString.replace(/[\s.-]/g, '');

  if (!/^\d{10}$/.test(cleanedPhone)) {
    return { isValid: false, error: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại di động gồm đúng 10 chữ số." };
  }

  const prefix = cleanedPhone.substring(0, 3);
  if (!validVietnamesePrefixes.includes(prefix)) {
    return { isValid: false, error: "Số điện thoại của bạn có đầu số không hợp lệ tại Việt Nam. Vui lòng kiểm tra lại." };
  }

  return { isValid: true };
};


const useSubmitRegistration = () => {
  const submitRegistration = useCallback(async (data: RegistrationData): Promise<SendEmailResult> => {
     if (!GOOGLE_SCRIPT_WEB_APP_URL || GOOGLE_SCRIPT_WEB_APP_URL.includes('PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE')) {
        return { success: false, error: 'URL của Google Apps Script chưa được cấu hình. Vui lòng liên hệ quản trị viên.' };
    }
    try {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value) {
                formData.append(key, value);
            }
        });

      // We use 'cors' mode to be able to read the response from the server.
      const response = await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
        method: 'POST',
        body: formData,
      });

      // Now we can check the actual response from the script.
      const result = await response.json();

      if (result.status === 'success') {
          return { success: true };
      } else {
          // The script returned an error, so we show it.
          console.error("Lỗi từ Google Apps Script:", result.message);
          return { success: false, error: `Lỗi từ máy chủ: ${result.message || 'Không rõ nguyên nhân.'}` };
      }

    } catch (error: any) {
      console.error("Lỗi khi gửi dữ liệu đến Google Sheet:", error);
      return { success: false, error: error.message || 'Lỗi mạng không xác định. Vui lòng kiểm tra kết nối.' };
    }
  }, []);
  return { submitRegistration };
};


// Helper to sanitize history for the AI
const getHistoryForAI = (allMessages: ChatMessage[]): Content[] => {
    return allMessages.map(msg => {
        let textForModel = msg.text;
        if (msg.sender === Sender.BOT) {
            const jsonBlockRegex = /({[^}]*})/;
            const match = msg.text.match(jsonBlockRegex);
            if (match) {
                try {
                    const parsed = JSON.parse(match[1]);
                    if (parsed.type === 'carousel') {
                        const jsonStartIndex = msg.text.lastIndexOf(match[0]);
                        const introText = msg.text.substring(0, jsonStartIndex).trim();
                        textForModel = introText || `[Đã hiển thị một danh sách khóa học]`;
                    }
                } catch (e) { /* Ignore parse error, send full text */ }
            }
        }
        return {
            role: msg.sender === Sender.USER ? 'user' : 'model',
            parts: [{ text: textForModel }]
        };
    });
};

// --- MAIN APP COMPONENT ---
function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('idle');
  const [registrationData, setRegistrationData] = useState<Partial<RegistrationData>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const ai = useRef<GoogleGenAI | null>(null);
  const { submitRegistration } = useSubmitRegistration();

  const addMessage = useCallback((sender: Sender, text: string, isActionResponse: boolean = false) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), sender, text, timestamp: new Date(), isActionResponse }]);
  }, []);

  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Lỗi: Biến môi trường process.env.API_KEY chưa được thiết lập.");
      addMessage(Sender.BOT, "Lỗi cấu hình: Không tìm thấy API Key. Vui lòng liên hệ quản trị viên để khắc phục sự cố này.");
      return;
    }
    ai.current = new GoogleGenAI({ apiKey });

    const welcomeText = 'Dạ chào bạn, tôi là Trợ lý Tuyển sinh của Trung tâm đào tạo HPTTS. Tôi có thể giúp gì cho bạn?';
    const buttons: QuickReplyButton[] = [
        { label: "Các nhóm khóa học", action: 'query', value: "Cho tôi xem các nhóm khóa học" },
        { label: "Tư vấn đăng ký", action: 'query', value: "Tư vấn thủ tục đăng ký học" },
        { label: "Thông tin liên hệ", action: 'query', value: "Cho tôi xin thông tin liên hệ" }
    ];
    const initialPayload: RichContent = { type: 'quick_replies', buttons };
    addMessage(Sender.BOT, welcomeText + '\n' + JSON.stringify(initialPayload));
  }, [addMessage]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleRegistrationFlow = useCallback((userInput: string) => {
    let currentData = { ...registrationData };

    switch (registrationStep) {
        case 'awaiting_name':
            currentData.fullName = userInput;
            setRegistrationData(currentData);
            addMessage(Sender.BOT, `Cảm ơn ${userInput}. Tiếp theo, bạn vui lòng cho mình biết ngày sinh của bạn (ví dụ: 25/12/1998) ạ.`);
            setRegistrationStep('awaiting_dob');
            break;

        case 'awaiting_dob':
            const dobValidation = validateDob(userInput);
            if (!dobValidation.isValid || !dobValidation.isAdult) {
                addMessage(Sender.BOT, dobValidation.error!);
                return; // Dừng lại, không chuyển bước
            }
            currentData.dob = userInput;
            setRegistrationData(currentData);
            addMessage(Sender.BOT, "Cảm ơn bạn. Cuối cùng, bạn cho mình xin số điện thoại để trung tâm liên hệ nhé.");
            setRegistrationStep('awaiting_phone');
            break;

        case 'awaiting_phone':
            const phoneValidation = validatePhone(userInput);
            if (!phoneValidation.isValid) {
                addMessage(Sender.BOT, phoneValidation.error!);
                return; // Dừng lại, không chuyển bước
            }
            currentData.phone = userInput;
            setRegistrationData(currentData);
            const confirmationText = `Cảm ơn bạn! Vui lòng xác nhận lại thông tin đăng ký:\n\n- **Khóa học:** ${currentData.courseName}\n- **Họ tên:** ${currentData.fullName}\n- **Ngày sinh:** ${currentData.dob}\n- **SĐT:** ${currentData.phone}\n\nNếu đã chính xác, vui lòng nhấn "Gửi Đăng Ký" để hoàn tất.`;
            const confirmationPayload: RichContent = {
                type: "quick_replies",
                buttons: [
                    { label: "✅ Gửi Đăng Ký", action: "confirm_registration", value: "confirm" },
                    { label: "✏️ Nhập lại", action: "retry_registration", value: "retry" }
                ]
            };
            addMessage(Sender.BOT, confirmationText + '\n' + JSON.stringify(confirmationPayload));
            setRegistrationStep('confirming');
            break;
    }
  }, [registrationStep, addMessage, registrationData]);

    const handleLocalQuery = useCallback((text: string): boolean => {
    const lowerCaseText = text.toLowerCase().trim();
    
    // Regex này được tinh chỉnh để chỉ bắt các câu hỏi chung về "nhóm" khóa học.
    const categoryQueryRegex = /^(cho\s+tôi\s+xem\s+)?(các|những)\s+nhóm\s+(khóa|khoá)\s+học|có\s+(những\s+)?(nhóm\s+khóa|khoá)\s+học\s+nào/i;
    
    if (categoryQueryRegex.test(lowerCaseText)) {
        // Sử dụng văn bản từ screenshot để phản hồi nhanh và nhất quán.
        const introText = "Dưới đây là các nhóm khóa học của chúng tôi:\n\n*   **Sơ cấp**: Các khóa học nghề cơ bản, chuyên sâu về vận hành thiết bị cảng, sửa chữa, hàn...\n*   **Bồi dưỡng/Nâng bậc**: Các khóa học ngắn hạn, nâng cao nghiệp vụ hoặc tay nghề cho người đã có kinh nghiệm.\n*   **An toàn vệ sinh lao động (ATVSLĐ)**: Các khóa huấn luyện bắt buộc theo quy định của pháp luật.\n\nBạn muốn tìm hiểu nhóm khóa học nào ạ?";

        const buttons: QuickReplyButton[] = [
            { label: "Khóa học Sơ cấp", action: 'show_category', value: 'SO_CAP' },
            { label: "Khóa học Bồi dưỡng/Nâng bậc", action: 'show_category', value: 'BOI_DUONG' },
            { label: "Khóa học ATVSLĐ", action: 'show_category', value: 'AN_TOAN' },
            { label: "Xem tất cả khóa học", action: 'show_category', value: 'ALL' }
        ];
        
        const payload: RichContent = { type: 'quick_replies', buttons };
        addMessage(Sender.BOT, introText + '\n' + JSON.stringify(payload));
        return true;
    }

    const registrationQueryRegex = /^(tư\s+vấn\s+)?(đăng\s+ký|register|ghi\s+danh|thủ\s+tục)/i;
    if (registrationQueryRegex.test(lowerCaseText)) {
        const introText = `Để đăng ký, bạn có hai lựa chọn ạ:\n\n1.  **Đăng ký nhanh qua Chatbot (Khuyên dùng):** Tôi sẽ hỏi bạn một vài thông tin cơ bản và giúp bạn gửi thông tin đăng ký trực tiếp đến phòng tuyển sinh. Nếu chưa có đủ hồ sơ, bạn nên chọn cách này.\n\n2.  **Điền Form Online:**\n    *   **Lưu ý quan trọng:** Để hoàn tất form, bạn cần chuẩn bị sẵn các bản scan hoặc ảnh chụp của: **CCCD, Giấy khám sức khỏe, và Sơ yếu lý lịch**.\n    *   Nếu đã có đủ giấy tờ, bạn hãy chọn form tương ứng bên dưới.`;
        const buttons: QuickReplyButton[] = [
            { label: "Xem các nhóm khóa học (để ĐK nhanh)", action: 'query', value: "Các nhóm khóa học" },
            { label: "Form Sơ cấp", action: 'open_form_sv', value: "https://docs.google.com/forms/d/e/1FAIpQLSeBzzxiW3edez3R6txOgUR-02txWPcMg8aNDd-thR0xWmQn8w/viewform" },
            { label: "Form Bồi dưỡng", action: 'open_form_bd', value: "https://forms.gle/xejqdxcxijSJUBZ69" }
        ];
        const payload: RichContent = { type: 'quick_replies', buttons };
        addMessage(Sender.BOT, introText + '\n' + JSON.stringify(payload));
        return true;
    }
    const contactQueryRegex = /(liên\s+hệ|contact|sđt|số\s+điện\s+thoại|địa\s+chỉ|email|gặp\s+ai)/i;
    if (contactQueryRegex.test(lowerCaseText)) {
        const text = `Bạn có thể liên hệ phòng Tuyển sinh qua các kênh sau ạ:\n- **Hotline/Zalo:** Mr. Hưng - 0904.468.575\n hoặc Ms. Thuỷ - 0989.387.936\n- **Điện thoại bàn:** 0225.3822900\n- **Website:** https://htts.com.vn/`;
        addMessage(Sender.BOT, text);
        return true;
    }
    return false;
  }, [addMessage]);

  const handleSendMessage = useCallback(async (messageText: string, isAction: boolean = false) => {
    if (!messageText.trim() || isLoading || isSubmitting || registrationStep === 'confirming') return;
    if (!isAction) addMessage(Sender.USER, messageText);
    setInput('');
    if (registrationStep !== 'idle') {
        handleRegistrationFlow(messageText);
        return;
    }
    if (handleLocalQuery(messageText)) return;

    setIsLoading(true);
    try {
        if (!ai.current) throw new Error("AI client not initialized");
        const history = getHistoryForAI(messages);
        const initialResponse: GenerateContentResponse = await ai.current.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [...history, { role: 'user', parts: [{ text: messageText }] }],
            config: { 
              systemInstruction,
              tools 
            },
        });
        let botResponseText = "";
        const functionCall = initialResponse.candidates?.[0]?.content?.parts[0]?.functionCall;
        if (functionCall && functionCall.name === 'get_current_schedule') {
             const toolResponsePart = { functionResponse: { name: 'get_current_schedule', response: { schedule: courseSchedule } } };
             const secondResponse = await ai.current.models.generateContent({
                 model: "gemini-2.5-flash",
                 contents: [...history, { role: 'user', parts: [{ text: messageText }] }, initialResponse.candidates![0].content, { role: 'tool', parts: [toolResponsePart] }],
                 config: { 
                    systemInstruction,
                    tools 
                 },
             });
             botResponseText = secondResponse.text;
        } else {
            botResponseText = initialResponse.text;
        }
         // FIXED: Safari-compatible regex that handles both ```json{...}``` and plain {...} formats
        const jsonBlockRegex = /```(?:json)?\s*\n?({[\s\S]+?})\s*\n?```\s*$|({[\s\S]+?})\s*$/;
        const match = botResponseText.match(jsonBlockRegex);
        let finalMessage = botResponseText;
        if (match) {
            try {
                // Use match[1] if it exists (code block format), otherwise use match[2] (plain JSON)
                const jsonString = match[1] || match[2];
                const parsed = JSON.parse(jsonString);
                if (parsed.action === 'show_course_list') {
                    const { filter } = parsed;
                    let filteredCourseEntries = Object.entries(courseList);
                    if (filter?.category && courseCategories[filter.category as keyof typeof courseCategories]) {
                        const categoryIds = courseCategories[filter.category as keyof typeof courseCategories].ids;
                        filteredCourseEntries = filteredCourseEntries.filter(([id]) => categoryIds.includes(id));
                    }
                    if (filter?.keyword) {
                        const keyword = filter.keyword.toLowerCase().trim();
                        filteredCourseEntries = filteredCourseEntries.filter(([id, course]) => id.toLowerCase().includes(keyword) || course.name.toLowerCase().includes(keyword));
                    }
                    const matchedText = match[0];
                    const jsonStartIndex = botResponseText.lastIndexOf(matchedText);
                    const introductoryText = botResponseText.substring(0, jsonStartIndex).trim();
                    if (filteredCourseEntries.length > 0) {
                        const carouselItems: CarouselItem[] = filteredCourseEntries.map(([id, course]) => {
                             const imageUrlKey = Object.keys(courseImageUrls).find(key => id.startsWith(key)) || 'DEFAULT';
                             return {
                                title: `${id}: ${course.name}`,
                                description: `Thời gian: ${course.duration} - Học phí: ${course.fee}`,
                                imageUrl: courseImageUrls[imageUrlKey] || courseImageUrls['DEFAULT'],
                                buttons: [{ label: "Xem chi tiết", action: "query", value: `Chi tiết khóa học ${id}` }, { label: "Đăng ký", action: "start_registration", value: id }]
                             };
                        });
                        const payload: RichContent = { type: 'carousel', items: carouselItems };
                        finalMessage = introductoryText + '\n' + JSON.stringify(payload);
                    } else {
                        const noResultText = "Rất tiếc, tôi không tìm thấy khóa học nào phù hợp. Bạn có thể thử lại với từ khóa khác hoặc xem các nhóm khóa học chính.";
                        const buttons: QuickReplyButton[] = [ { label: "Các nhóm khóa học", action: 'query', value: "Cho tôi xem các nhóm khóa học" } ];
                        const payload: RichContent = { type: 'quick_replies', buttons };
                        finalMessage = noResultText + '\n' + JSON.stringify(payload);
                    }
                }
            } catch (e) { /* Not a valid JSON command, treat as plain text */ }
          }
        addMessage(Sender.BOT, finalMessage);
    } catch (error) {
        console.error("Lỗi gọi Gemini API:", error);
        addMessage(Sender.BOT, "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ Mr. Hưng (0904468575) hoặc Ms. Thuỷ (0989387936) để được hỗ trợ.");
    } finally {
        setIsLoading(false);
    }
  }, [addMessage, registrationStep, handleRegistrationFlow, messages, handleLocalQuery, isSubmitting, isLoading]);

   const handleAction = useCallback(async (action: string, value: string) => {
        if (isSubmitting || isLoading) return;
        if (action === 'query') {
            addMessage(Sender.USER, value, true);
            handleSendMessage(value, true);
        } else if (action === 'show_category') {
            const categoryName = value === 'ALL' ? 'Tất cả các khóa học' : courseCategories[value as keyof typeof courseCategories].name;
            addMessage(Sender.USER, `Xem nhóm: ${categoryName}`, true);

            const courseIds = value === 'ALL' 
                ? Object.keys(courseList) 
                : courseCategories[value as keyof typeof courseCategories]?.ids || [];

            if (courseIds.length > 0) {
                const introText = value === 'ALL'
                    ? `Dạ đây là tất cả các khóa học hiện có tại HPTTS ạ:`
                    : `Đây là các khóa học thuộc nhóm **${categoryName}** ạ:`;

                const carouselItems: CarouselItem[] = courseIds.map(id => {
                    const course = courseList[id];
                    const imageUrlKey = Object.keys(courseImageUrls).find(key => id.startsWith(key)) || 'DEFAULT';
                    return {
                        title: `${id}: ${course.name}`,
                        description: `Thời gian: ${course.duration} - Học phí: ${course.fee}`,
                        imageUrl: courseImageUrls[imageUrlKey] || courseImageUrls['DEFAULT'],
                        buttons: [{ label: "Xem chi tiết", action: "query", value: `Chi tiết khóa học ${id}` }, { label: "Đăng ký", action: "start_registration", value: id }]
                    };
                });
                const payload: RichContent = { type: 'carousel', items: carouselItems };
                addMessage(Sender.BOT, introText + '\n' + JSON.stringify(payload));
            }
        } else if (action === 'start_registration') {
            const courseId = value;
            const courseName = courseList[courseId]?.name || "Không rõ";
            setRegistrationData({ courseId, courseName });
            setRegistrationStep('awaiting_name');
            addMessage(Sender.USER, `Đăng ký khóa học: ${courseName}`, true);
            addMessage(Sender.BOT, `Rất tuyệt! Để đăng ký khóa học **${courseName}**, chúng ta hãy bắt đầu với một vài thông tin cơ bản nhé.\n\nĐầu tiên, bạn vui lòng nhập **họ và tên đầy đủ** của bạn vào ô chat bên dưới.`);
        } else if (action === 'open_form_sv' || action === 'open_form_bd') {
            addMessage(Sender.USER, `Mở form đăng ký online`, true);
            window.open(value, '_blank');
            addMessage(Sender.BOT, "Đã mở form đăng ký trong một tab mới. Bạn có cần hỗ trợ gì thêm không ạ?");
        } else if (action === 'confirm_registration') {
             if (registrationStep === 'confirming') {
                addMessage(Sender.USER, 'Xác nhận & Gửi đăng ký', true);
                setIsSubmitting(true);
                const result = await submitRegistration(registrationData as RegistrationData);
                if (result.success) {
                    addMessage(Sender.BOT, "✅ Đăng ký thành công! Cảm ơn bạn. Thông tin của bạn đã được ghi nhận. Phòng tuyển sinh sẽ sớm liên hệ với bạn để xác nhận và hướng dẫn các bước tiếp theo.");
                } else {
                    addMessage(Sender.BOT, `❌ Rất tiếc, đã có lỗi xảy ra trong quá trình gửi. Vui lòng thử lại, hoặc liên hệ trực tiếp Mr. Hưng (0904468575) hoặc Ms. Thuỷ (0989387936) để được hỗ trợ.\n\nLỗi: ${result.error || 'Không rõ'}`);
                }
                setIsSubmitting(false);
                setRegistrationStep('idle');
                setRegistrationData({});
            }
        } else if (action === 'retry_registration') {
            if (registrationStep === 'confirming') {
                addMessage(Sender.USER, 'Sửa lại thông tin', true);
                const { courseId, courseName } = registrationData;
                setRegistrationData({ courseId, courseName });
                setRegistrationStep('awaiting_name');
                addMessage(Sender.BOT, `Dạ được ạ. Chúng ta hãy bắt đầu nhập lại thông tin cho khóa học **${courseName}**.\n\nVui lòng nhập lại **họ và tên đầy đủ** của bạn.`);
            }
        }
    }, [handleSendMessage, addMessage, registrationData, registrationStep, submitRegistration, isSubmitting, isLoading]);

  const handleReset = useCallback(() => {
    setMessages([]);
    setRegistrationStep('idle');
    setRegistrationData({});
    const welcomeText = 'Chào bạn, chúng ta hãy bắt đầu lại từ đầu nhé. Tôi có thể giúp gì cho bạn?';
     const buttons: QuickReplyButton[] = [
        { label: "Các nhóm khóa học", action: 'query', value: "Cho tôi xem các nhóm khóa học" },
        { label: "Tư vấn đăng ký", action: 'query', value: "Tư vấn thủ tục đăng ký học" },
        { label: "Thông tin liên hệ", action: 'query', value: "Cho tôi xin thông tin liên hệ" }
    ];
    const initialPayload: RichContent = { type: 'quick_replies', buttons };
    addMessage(Sender.BOT, welcomeText + '\n' + JSON.stringify(initialPayload));
  }, [addMessage]);

  return (
    <div 
      className="flex flex-col h-screen max-h-screen bg-cover bg-center text-gray-800 font-sans"
      style={{ backgroundImage: "url('https://i.postimg.cc/htHNRcqW/a2aa61fe-c3e9-4944-91cb-0ab480de88f3.png')" }}
    >
      <header className="flex-shrink-0 bg-blue-600/90 backdrop-blur-sm text-white p-2 md:p-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <img src={hpttsLogoDataUrl} alt="HPTTS Logo" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h1 className="text-sm md:text-base font-bold">Chatbot HPTTS</h1>
            <p className="text-xs text-blue-100">Tư vấn tuyển sinh</p>
          </div>
        </div>
        <button onClick={handleReset} className="p-2 rounded-full hover:bg-blue-700 transition-colors" aria-label="Bắt đầu lại cuộc trò chuyện">
          <ResetIcon />
        </button>
      </header>
      <main ref={chatContainerRef} className="flex-grow p-2 md:p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full">
            {messages.map((msg, index) => (
                <ChatMessageItem hpttsLogoDataUrl={hpttsLogoDataUrl} key={`${msg.id}-${index}`} message={msg} onAction={handleAction}/>
            ))}
            {(isLoading || isSubmitting) && (
                 <div className="flex items-end gap-2 mb-4 justify-start">
                    <img src={hpttsLogoDataUrl} alt="Bot Avatar" className="w-8 h-8 rounded-full self-start flex-shrink-0 object-cover" />
                    <div className="px-4 py-3 rounded-xl shadow-md bg-white/95 backdrop-blur-sm text-gray-800 rounded-bl-none">
                        <LoadingSpinner size="sm" />
                    </div>
                </div>
            )}
        </div>
      </main>
      <footer className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-t border-gray-200/50 p-2 md:p-3">
        <div className="max-w-3xl mx-auto w-full">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={registrationStep !== 'idle' ? "Nhập thông tin của bạn..." : "Nhập câu hỏi..."}
                className="w-full px-4 py-2 bg-gray-100 rounded-full border-2 border-transparent focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading || registrationStep === 'confirming' || isSubmitting}
              />
              <button type="submit" disabled={isLoading || !input.trim() || registrationStep === 'confirming' || isSubmitting} className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 transition-colors flex-shrink-0" aria-label="Gửi tin nhắn">
                <SendIcon />
              </button>
            </form>
            <p className="text-center text-xs text-gray-500 mt-2">&copy; 2025 HPTTS</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

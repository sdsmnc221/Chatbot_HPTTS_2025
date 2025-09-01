import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, RichContent } from '../types';
import { Sender } from '../types';
import { courseImageUrls } from '../data/courses';
import { LazyImage } from './LazyImage';

interface ChatMessageItemProps {
  message: ChatMessage;
  onAction: (action: string, value: string) => void;
  hpttsLogoDataUrl: string;
}

const RichContentRenderer: React.FC<{ content: RichContent; onAction: ChatMessageItemProps['onAction'] }> = ({ content, onAction }) => {
    switch (content.type) {
        case 'carousel':
            return (
                <div className="flex flex-col space-y-3">
                    {content.items?.map((item, index) => (
                        <div key={index} className="w-full bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex">
                            <LazyImage 
                                src={item.imageUrl} 
                                alt={item.title} 
                                fallbackSrc={courseImageUrls['DEFAULT']}
                                className="w-24 h-auto object-cover flex-shrink-0"
                            />
                            {/* TINH CHỈNH QUAN TRỌNG: Thêm class `min-w-0`
                                Class này khắc phục lỗi trên trình duyệt Safari (iOS),
                                đảm bảo phần nội dung chữ sẽ tự động xuống dòng khi cần
                                thay vì làm vỡ bố cục.
                            */}
                            <div className="p-3 flex flex-col flex-grow min-w-0">
                                <div className="flex-grow">
                                    <h4 className="font-bold text-sm text-gray-900 break-words">{item.title}</h4>
                                    <p className="text-xs text-gray-600 mt-1 break-words">{item.description}</p>
                                </div>
                                <div className="mt-2 pt-2 flex items-center space-x-2">
                                    {item.buttons.map((button, btnIndex) => (
                                        <button key={btnIndex} onClick={() => onAction(button.action, button.value)}
                                            className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors duration-150 disabled:bg-gray-400">
                                            {button.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        case 'quick_replies':
            return (
                 <div className="flex flex-wrap gap-2">
                    {content.buttons?.map((button, index) => (
                        <button key={index} onClick={() => onAction(button.action, button.value)}
                            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors duration-150">
                            {button.label}
                        </button>
                    ))}
                </div>
            );
        default: return null;
    }
};

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onAction, hpttsLogoDataUrl }) => {
  const isUser = message.sender === Sender.USER;
  const formatDate = (date: Date) => date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  let introductoryText = message.text;
  let richContent: RichContent | null = null;
  
  if (message.sender === Sender.BOT) {
    const jsonBlockRegex = /({[^{}]*"type"[^{}]*(?:{[^}]*}[^{}]*)*})\s*$/;
    const match = message.text.match(jsonBlockRegex);
    
    if (match) {
        const jsonStr = match[1];
        const jsonStartIndex = message.text.lastIndexOf(match[0]);
        
        try {
            const parsed = JSON.parse(jsonStr);
            if ((parsed.type === 'carousel' && Array.isArray(parsed.items)) || 
                (parsed.type === 'quick_replies' && Array.isArray(parsed.buttons))) {
            
                richContent = parsed;
                const tempIntro = message.text.substring(0, jsonStartIndex).trim();
                const otherJsonRegex = /({[\s\S]+?})/g;
                introductoryText = tempIntro.replace(otherJsonRegex, '').replace(/\s+/g, ' ').trim();
            }
        } catch (e) { /* Không phải JSON hợp lệ, bỏ qua */ }
    }
  }

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <img src={hpttsLogoDataUrl} alt="Bot Avatar" className="w-8 h-8 rounded-full self-start flex-shrink-0 object-cover" />}
      <div className={`flex flex-col max-w-[90%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-xl shadow-md ${isUser ? (message.isActionResponse ? 'bg-gray-400 text-white rounded-br-none' : 'bg-blue-500 text-white rounded-br-none') : 'bg-white/95 backdrop-blur-sm text-gray-800 rounded-bl-none'}`}>
          {/* Tối ưu: Đảm bảo class `break-words` được áp dụng cho nội dung văn bản thuần túy.
            Mã gốc của bạn đã có phần này, đây là một thực hành tốt.
          */}
          <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none break-words">
            {introductoryText && (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold" /> }}>
                {introductoryText}
              </ReactMarkdown>
            )}
            {richContent && <div className="mt-2 -mx-2"><RichContentRenderer content={richContent as RichContent} onAction={onAction} /></div>}
          </div>
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">{formatDate(message.timestamp)}</span>
      </div>
       {isUser && <div className="w-8 h-8 rounded-full self-start bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">B</div>}
    </div>
  );
};
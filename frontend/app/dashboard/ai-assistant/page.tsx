import AiAssistant from '@/components/ai-assistant/ai-assistant';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Assistant | CyberVision AI',
  description: 'Real-time AI surveillance copilot and case investigation assistant',
};

export default function AiAssistantPage() {
  return (
    <div className="h-[calc(100vh-4rem)] -m-4 md:-m-6 flex flex-col overflow-hidden bg-background">
      <AiAssistant />
    </div>
  );
}
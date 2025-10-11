import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChatSystem } from '@/components/ChatSystem';
import { MessageCircle, X } from 'lucide-react';

export const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </div>

      {/* Chat System Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-end p-6">
          <div className="w-full max-w-md">
            <ChatSystem isOpen={isOpen} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};
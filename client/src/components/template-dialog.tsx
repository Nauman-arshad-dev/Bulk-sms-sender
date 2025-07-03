import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, content: string) => void;
}

export function TemplateDialog({ open, onOpenChange, onSave }: TemplateDialogProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (name.trim() && content.trim()) {
      onSave(name, content);
      setName("");
      setContent("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Message Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome Message"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="template-content">Message Content</Label>
            <Textarea
              id="template-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hi {name}! Your message here... Reply STOP to opt out."
              rows={5}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {"{name}"} for personalization. Always include opt-out instructions.
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!name.trim() || !content.trim()}
            >
              Save Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
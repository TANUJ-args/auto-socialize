import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Image, Type, Bell, Shield, Palette } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [aiModel, setAiModel] = useState("text");
  const [notifications, setNotifications] = useState(true);
  const [autoPublish, setAutoPublish] = useState(true);

  const handleSave = () => {
    // Save settings to localStorage for now
    localStorage.setItem('settings', JSON.stringify({
      aiModel,
      notifications,
      autoPublish
    }));
    toast.success("Settings saved successfully");
  };

  return (
    <div className="container py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your SocialFlow preferences
          </p>
        </div>

        {/* AI Model Selection */}
        <Card className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">AI Model</h2>
          </div>
          
          <RadioGroup value={aiModel} onValueChange={setAiModel}>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <RadioGroupItem value="text" id="text" />
                <div className="flex-1">
                  <Label htmlFor="text" className="flex items-center gap-2 cursor-pointer">
                    <Type className="h-4 w-4" />
                    OpenAI Text Generation
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Best for creating engaging text content and captions
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <RadioGroupItem value="images" id="images" />
                <div className="flex-1">
                  <Label htmlFor="images" className="flex items-center gap-2 cursor-pointer">
                    <Image className="h-4 w-4" />
                    Hugging Face Images
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate content with AI-created images
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </Card>

        {/* Notifications */}
        <Card className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about post publishing status
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </Card>

        {/* Publishing */}
        <Card className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Publishing</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-publish">Auto-Publish</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically publish scheduled posts
                </p>
              </div>
              <Switch
                id="auto-publish"
                checked={autoPublish}
                onCheckedChange={setAutoPublish}
              />
            </div>
          </div>
        </Card>

        {/* Theme */}
        <Card className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Appearance</h2>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Dark theme is currently active. Light theme coming soon!
          </p>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} variant="gradient" size="lg">
            Save Settings
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { Plug, Check, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  status?: 'active' | 'pending' | 'error';
}

const IntegrationSettings: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'whatsapp',
      name: 'WhatsApp Business API',
      description: 'Send automated messages and notifications to customers via WhatsApp',
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-8 w-8" />,
      connected: true,
      status: 'active'
    },
    {
      id: 'google',
      name: 'Google Calendar',
      description: 'Sync your orders and appointments with Google Calendar',
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="h-8 w-8" />,
      connected: false
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Process online payments securely with Stripe',
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-8 w-8" />,
      connected: false
    },
    {
      id: 'firebase',
      name: 'Firebase',
      description: 'Real-time notifications and data synchronization',
      icon: <img src="https://www.gstatic.com/devrel-devsite/prod/v2f6fb68338062e7c16672db62c4ab042dcb9bfbacf2fa51b6959426b203a4d8a/firebase/images/touchicon-180.png" alt="Firebase" className="h-8 w-8" />,
      connected: true,
      status: 'active'
    },
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Database and authentication services',
      icon: <img src="https://supabase.com/favicon/favicon-196x196.png" alt="Supabase" className="h-8 w-8" />,
      connected: true,
      status: 'active'
    },
    {
      id: 'gemini',
      name: 'Google Gemini AI',
      description: 'AI-powered insights and automation',
      icon: <img src="https://lh3.googleusercontent.com/vCwOBfHYvNVsYPpYJ51GaWpZ3SzrjGQHgD_HYzfFpuO5Jb_k-3YUJZWFHXJTxaT_Wg=w240-h480-rw" alt="Gemini" className="h-8 w-8" />,
      connected: true,
      status: 'active'
    }
  ]);

  const handleToggleConnection = (id: string) => {
    setLoading(id);
    
    // Simulate API call
    setTimeout(() => {
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id 
            ? { 
                ...integration, 
                connected: !integration.connected,
                status: !integration.connected ? 'active' : undefined
              } 
            : integration
        )
      );
      
      const integration = integrations.find(i => i.id === id);
      if (integration) {
        toast.success(`${integration.name} ${integration.connected ? 'disconnected' : 'connected'} successfully`);
      }
      
      setLoading(null);
    }, 1500);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Plug className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Integrations</h2>
      </div>
      
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Connect your Classic Offset account with these services to enhance your workflow.
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          {integrations.map(integration => (
            <div key={integration.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {integration.icon}
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {integration.name}
                      {integration.connected && integration.status === 'active' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <Check className="w-3 h-3 mr-1" />
                          Connected
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
                    
                    {integration.connected && (
                      <div className="mt-2">
                        <a 
                          href="#" 
                          className="text-xs text-primary hover:underline inline-flex items-center"
                          onClick={(e) => e.preventDefault()}
                        >
                          Configure settings
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant={integration.connected ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleToggleConnection(integration.id)}
                  disabled={loading === integration.id}
                >
                  {loading === integration.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {integration.connected ? 'Disconnecting...' : 'Connecting...'}
                    </>
                  ) : (
                    integration.connected ? 'Disconnect' : 'Connect'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">Need more integrations?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We're constantly adding new integrations. If you need a specific integration that's not listed here, please let us know.
          </p>
          <Button variant="outline" size="sm">
            Request Integration
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default IntegrationSettings;
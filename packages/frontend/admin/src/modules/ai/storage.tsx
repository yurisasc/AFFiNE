import { Button } from '@affine/admin/components/ui/button';
import { Card } from '@affine/admin/components/ui/card';
import { Checkbox } from '@affine/admin/components/ui/checkbox';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@affine/admin/components/ui/select';
import { Separator } from '@affine/admin/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useKeys } from './use-keys';

export function Storage() {
  const { apiKeys, loading, updateKey } = useKeys();
  const initialLoadDone = useRef(false);

  // Common fields
  const [storageProvider, setStorageProvider] = useState<
    'fs' | 'aws-s3' | 'cloudflare-r2'
  >('fs');
  const [storageBucket, setStorageBucket] = useState('copilot');

  // File System specific fields
  const [fsPath, setFsPath] = useState('~/.affine/storage');

  // S3 & R2 common fields
  const [region, setRegion] = useState('');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');

  // R2 specific fields
  const [accountId, setAccountId] = useState('');
  const [usePresignedURL, setUsePresignedURL] = useState(false);
  const [urlPrefix, setUrlPrefix] = useState('');
  const [signKey, setSignKey] = useState('');

  const [savingStorage, setSavingStorage] = useState(false);

  // Load initial values only once when data is first available
  useEffect(() => {
    if (!loading && apiKeys && !initialLoadDone.current) {
      if (apiKeys.storage) {
        setStorageProvider(apiKeys.storage.provider || 'fs');
        setStorageBucket(apiKeys.storage.bucket || 'copilot');

        // File System
        setFsPath(apiKeys.storage.config?.path || '~/.affine/storage');

        // S3 & R2 common fields
        setRegion(apiKeys.storage.config?.region || '');
        setAccessKeyId(apiKeys.storage.config?.accessKeyId || '');
        setSecretAccessKey(apiKeys.storage.config?.secretAccessKey || '');

        // R2 specific fields
        setAccountId(apiKeys.storage.config?.accountId || '');
        setUsePresignedURL(!!apiKeys.storage.config?.usePresignedURL?.enabled);
        setUrlPrefix(apiKeys.storage.config?.usePresignedURL?.urlPrefix || '');
        setSignKey(apiKeys.storage.config?.usePresignedURL?.signKey || '');
      }
      initialLoadDone.current = true;
    }
  }, [apiKeys, loading]);

  // Handler to save storage settings
  const handleSaveStorage = () => {
    setSavingStorage(true);

    try {
      let config: Record<string, any>;

      // Structure the config based on provider
      if (storageProvider === 'fs') {
        config = {
          provider: storageProvider,
          bucket: storageBucket,
          config: {
            path: fsPath,
          },
        };
      } else if (storageProvider === 'aws-s3') {
        config = {
          provider: storageProvider,
          bucket: storageBucket,
          config: {
            region,
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          },
        };
      } else {
        // cloudflare-r2
        const r2Config: Record<string, any> = {
          region,
          accountId,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        };

        if (usePresignedURL) {
          r2Config.usePresignedURL = {
            enabled: true,
            urlPrefix,
            signKey,
          };
        }

        config = {
          provider: storageProvider,
          bucket: storageBucket,
          config: r2Config,
        };
      }

      updateKey({
        provider: 'storage' as keyof typeof apiKeys,
        config,
      });
    } finally {
      // Clear saving state after a short delay for better UX
      setTimeout(() => {
        setSavingStorage(false);
      }, 1000);
    }
  };

  // Render form fields based on selected provider
  const renderProviderFields = () => {
    switch (storageProvider) {
      case 'fs':
        return (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Storage Path</Label>
            <Input
              type="text"
              className="py-2 px-3 text-base font-normal"
              value={fsPath}
              placeholder="~/.affine/storage"
              onChange={e => setFsPath(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Local file system path where files will be stored
            </p>
          </div>
        );

      case 'aws-s3':
      case 'cloudflare-r2':
        return (
          <div className="space-y-4">
            {storageProvider === 'aws-s3' && (
              <>
                <Label className="text-sm font-medium">Region</Label>
                <Input
                  type="text"
                  className="py-2 px-3 text-base font-normal"
                  value={region}
                  placeholder="us-east-1"
                  onChange={e => setRegion(e.target.value)}
                />
              </>
            )}

            <Label className="text-sm font-medium">Access Key ID</Label>
            <Input
              type="password"
              className="py-2 px-3 text-base font-normal"
              value={accessKeyId}
              placeholder="Access Key ID"
              onChange={e => setAccessKeyId(e.target.value)}
            />

            <Label className="text-sm font-medium">Secret Access Key</Label>
            <Input
              type="password"
              className="py-2 px-3 text-base font-normal"
              value={secretAccessKey}
              placeholder="Secret Access Key"
              onChange={e => setSecretAccessKey(e.target.value)}
            />

            {storageProvider === 'cloudflare-r2' && (
              <>
                <Label className="text-sm font-medium">Account ID</Label>
                <Input
                  type="text"
                  className="py-2 px-3 text-base font-normal"
                  value={accountId}
                  placeholder="Cloudflare Account ID"
                  onChange={e => setAccountId(e.target.value)}
                />

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="usePresignedURL"
                    checked={usePresignedURL}
                    onCheckedChange={checked => setUsePresignedURL(!!checked)}
                  />
                  <Label
                    htmlFor="usePresignedURL"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Use Presigned URL
                  </Label>
                </div>

                {usePresignedURL && (
                  <>
                    <Label className="text-sm font-medium">URL Prefix</Label>
                    <Input
                      type="text"
                      className="py-2 px-3 text-base font-normal"
                      value={urlPrefix}
                      placeholder="https://storage.example.com"
                      onChange={e => setUrlPrefix(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      The presigned URL prefix for Cloudflare R2
                    </p>

                    <Label className="text-sm font-medium">Sign Key</Label>
                    <Input
                      type="password"
                      className="py-2 px-3 text-base font-normal"
                      value={signKey}
                      placeholder="Sign Key for presigned URLs"
                      onChange={e => setSignKey(e.target.value)}
                    />
                  </>
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Validate the form based on provider
  const isFormValid = () => {
    if (!storageBucket) return false;

    switch (storageProvider) {
      case 'fs':
        return !!fsPath;

      case 'aws-s3':
        return !!region && !!accessKeyId && !!secretAccessKey;

      case 'cloudflare-r2': {
        const basicFieldsValid =
          !!region && !!accessKeyId && !!secretAccessKey && !!accountId;
        if (!usePresignedURL) return basicFieldsValid;
        return basicFieldsValid && !!urlPrefix && !!signKey;
      }

      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col gap-3 py-5 px-6 w-full">
      <div className="flex items-center">
        <span className="text-xl font-semibold">Storage Configuration</span>
      </div>
      <div className="flex-grow overflow-y-auto space-y-[10px]">
        <Card className="flex flex-col rounded-md border py-4 gap-4">
          <div className="px-5 space-y-4">
            <Label className="text-sm font-medium">Storage Provider</Label>
            <Select
              value={storageProvider}
              onValueChange={value =>
                setStorageProvider(value as 'fs' | 'aws-s3' | 'cloudflare-r2')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a storage provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fs">File System</SelectItem>
                <SelectItem value="aws-s3">AWS S3</SelectItem>
                <SelectItem value="cloudflare-r2">Cloudflare R2</SelectItem>
              </SelectContent>
            </Select>

            <Label className="text-sm font-medium">Bucket</Label>
            <Input
              type="text"
              className="py-2 px-3 text-base font-normal"
              value={storageBucket}
              onChange={e => setStorageBucket(e.target.value)}
            />

            {renderProviderFields()}

            <div className="flex justify-end pt-2">
              <Button
                disabled={!isFormValid() || savingStorage}
                onClick={handleSaveStorage}
              >
                {savingStorage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save Storage Config'
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="px-5 space-y-3 text-sm font-normal text-gray-500">
            <p>
              These storage settings will affect where AI-related data is
              stored.
            </p>
            <p className="mt-1">
              {storageProvider === 'fs'
                ? 'File System storage is simplest but limited to a single server.'
                : storageProvider === 'aws-s3'
                  ? 'AWS S3 provides scalable, durable object storage in the cloud.'
                  : 'Cloudflare R2 is compatible with the S3 API but without egress fees.'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// import { UploadClient} from '@uploadcare/upload-client'
// import { Divide } from 'lucide-react'
import { onChatBotImageUpdate, onUpdateDomain, onUpdatePassword, onUpdateWelcomeMessage } from "@/actions/settings";
import { toast } from "sonner"
import {
  ChangePasswordProps,
  ChangePasswordSchema,
} from "@/schemas/auth.schema";
import {
  DomainSettingsProps,
  DomainSettingsSchema,
} from "@/schemas/settings.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const upload = new UploadClient({
publicKey: process.env.NEXT_PUBLIC_UPLOAD_CARE_PUBLIC_KET as string,
})

export const useThemeMode = () => {
  const { setTheme, theme } = useTheme();

  return {
    setTheme,
    theme,
  };
};

export const useChangePassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordProps>({
    resolver: zodResolver(ChangePasswordSchema),
    mode: "onChange",
  });

  //  const {toast} = useToast()
  const [loading, setLoading] = useState<boolean>(false);

  const onChangePassword = handleSubmit(async (values) => {
    try {
      setLoading(true);
      const updated = await onUpdatePassword(values.password);
      if (updated) {
        reset();
        setLoading(false);
        toast({ title: "Success", description: updated.message });
      }
    } catch (error) {
      console.log(error);
    }
  });
  return {
    register,
    errors,
    onChangePassword,
    loading,
  };
};

export const useSettings = (id: string) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DomainSettingsProps>({
    resolver: zodResolver(DomainSettingsSchema),
  });
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const onUpdateSettings = handleSubmit(async (values) => {
    setLoading(true);
    if (values.domain) {
      const domain = await onUpdateDomain(id, values.domain);
      if (domain) {
        toast("Success", {
          description: domain.message
        })
      }
    }
    if(values.image[0]) {
const uploaded = await upload.uploadFile(values.image[0])
const image = await onChatBotImageUpdate(id, upload.uuid)
 if (image) {
        toast(image.status==200 ? 'Success' : 'Error', {
          description: image.message,
        })
        setLoading(false)
      }
    }
    if(values.welcomeMessage){
      const message = await onUpdateWelcomeMessage(values.welcomeMessage, id);
      if(message){
        toast('Success', {
          description: message.message,
        });
      }
    }
  });
};

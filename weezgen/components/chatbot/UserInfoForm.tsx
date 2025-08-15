"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserInfoFormProps,
  UserInfoFormSchema,
} from "@/schemas/coversation.schema";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  countryCodes,
  detectCountryFromIP,
  CountryCode,
} from "@/lib/countryCodes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { User, Mail, Phone } from "lucide-react";

interface UserInfoFormComponentProps {
  onSubmit: (data: UserInfoFormProps) => void;
  loading?: boolean;
}

const UserInfoForm: React.FC<UserInfoFormComponentProps> = ({
  onSubmit,
  loading = false,
}) => {
  const [detectedCountry, setDetectedCountry] = useState<CountryCode | null>(
    null
  );
  const [isDetecting, setIsDetecting] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserInfoFormProps>({
    resolver: zodResolver(UserInfoFormSchema as any),
    defaultValues: {
      countryCode: "+1",
    },
  });

  const selectedCountryCode = watch("countryCode");

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const country = await detectCountryFromIP();
        if (country) {
          setDetectedCountry(country);
          setValue("countryCode", country.dialCode);
        }
      } catch (error) {
        console.error("Error detecting country:", error);
      } finally {
        setIsDetecting(false);
      }
    };

    detectCountry();
  }, [setValue]);

  const handleFormSubmit = (data: UserInfoFormProps) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold text-gray-800">
          Welcome! 👋
        </CardTitle>
        <CardDescription className="text-gray-600">
          Please provide your information to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              <User className="inline w-4 h-4 mr-2" />
              Full Name *
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter your full name"
              className={`w-full ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              <Mail className="inline w-4 h-4 mr-2" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="Enter your email address"
              className={`w-full ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-gray-700"
            >
              <Phone className="inline w-4 h-4 mr-2" />
              Phone Number (Optional)
            </Label>
            <div className="flex gap-2">
              <Select
                value={selectedCountryCode}
                onValueChange={(value) => setValue("countryCode", value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue>
                    {isDetecting ? (
                      <span className="text-gray-400">Detecting...</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>{detectedCountry?.flag || "🇺🇸"}</span>
                        <span>{selectedCountryCode}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countryCodes.map((country: CountryCode) => (
                    <SelectItem key={country.code} value={country.dialCode}>
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.dialCode}</span>
                        <span className="text-gray-500">({country.name})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="Enter phone number"
                className="flex-1"
              />
            </div>
            {detectedCountry && (
              <p className="text-xs text-green-600">
                📍 Detected your location: {detectedCountry.name} (
                {detectedCountry.flag})
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            disabled={loading}
          >
            {loading ? "Starting Chat..." : "Start Chat"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserInfoForm;

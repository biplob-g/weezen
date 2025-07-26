"use client";

import { Button } from "@/components/ui/button";
import { useAuthContextHook } from "@/context/useAuthContext";
import { useSignUpForm } from "@/hooks/sign-up/useSignUp";
import Link from "next/link";
import React from "react";
import { useFormContext } from "react-hook-form";

const ButtonHandler = () => {
  const { setCurrentStep, currentStep } = useAuthContextHook();
  const { formState, getFieldState, getValues } = useFormContext();
  const { onGenerateOTP } = useSignUpForm();

  const { isDirty: isName } = getFieldState("fullname", formState);
  const { isDirty: isEmail } = getFieldState("email", formState);
  const { isDirty: isPassword } = getFieldState("password", formState);

  if (currentStep === 3) {
    return (
      <div className="w-full flex flex-col gap-3 items-center">
        <Button type="submit" className="w-full cursor-pointer">
          Create an account
        </Button>
        <p>
          Already have an account?
          <Link href="/auth/sign-in" className="font-bold">
            Sign In
          </Link>
        </p>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="w-full flex flex-col gap-3 items-center">
        <Button
          type="submit"
          className="w-full cursor-pointer"
          {...(isName &&
            isEmail &&
            isPassword && {
              onClick: () =>
                onGenerateOTP(
                  getValues("email"),
                  getValues("password"),
                  setCurrentStep
                ),
            })}
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col ap-3 items-center">
      <Button
        type="submit"
        className="w-full cursor-pointer bg-primary-gradient"
        onClick={() => setCurrentStep((prev: number) => prev + 1)}
      >
        Continue
      </Button>
      <p className="py-3">
        Already have an account? &nbsp;
        <Link href="/auth/sign-in" className="font-bold">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default ButtonHandler;

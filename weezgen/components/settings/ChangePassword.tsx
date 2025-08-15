"use client";

import { useChangePassword } from "@/hooks/settings/useSettings";
import React from "react";
import Section from "../SectionLabel";
import FormGenerator from "../forms/SignUp/formGenerator";
import { Button } from "../ui/button";
import { Loader } from "../loader";

type Props = {};

const ChangePassword = (props: Props) => {
  const { register, errors, onChangePassword, loading } = useChangePassword();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section label="Change Password" message="Reset your password" />
      </div>
      <form onSubmit={onChangePassword} className="lg:col-span-4">
        <div className="lg:w-[600px] flex flex-col gap-3">
          <FormGenerator
            register={register}
            errors={errors}
            name="password"
            placeholder="New Password"
            type="text"
            inputType="input"
          />
          <FormGenerator
            register={register}
            errors={errors}
            name="confirmPassword"
            placeholder="Confirm Password"
            type="text"
            inputType="input"
          />
          <Button className="bg-primary text-gray-200 font-semibold">
            {" "}
            <Loader loading={loading}>Change Password</Loader>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;

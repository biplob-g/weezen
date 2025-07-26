import { USER_REGISTRATION_FORM } from "@/constants/forms";
import React from "react";
import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";
import FormGenerator from "./formGenerator";

type Props = {
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors<FieldValues>;
};

const AccountDetailsForm = ({ errors, register }: Props) => {
  return (
    <>
      <h2 className="text-gray-500 md:text-4xl font-bold">Account Details</h2>
      <p className="text-gray-600 md:text-sm">Enter your email and password</p>
      {USER_REGISTRATION_FORM.map((field) => {
        return (
          <FormGenerator
            key={field.id}
            {...field}
            errors={errors}
            register={register}
            name={field.name}
          />
        );
      })}
    </>
  );
};

export default AccountDetailsForm;

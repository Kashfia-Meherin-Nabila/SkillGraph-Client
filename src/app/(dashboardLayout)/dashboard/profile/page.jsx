"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiCamera,
  FiSave,
  FiArrowLeft,
  FiShield,
  FiLoader,
} from "react-icons/fi";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(null);
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);

 

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <FiLoader className="animate-spin text-violet-600" size={28} />
          <p className="text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <FiUser size={28} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Sign in required
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Please sign in to view and update your profile.
          </p>

          <Link
            href="/sign-in"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Use session values by default without copying them into state in an effect.
 
  const currentName = name !== null ? name : session.user.name || "";

  const currentImage = image !== null ? image : session.user.image || "";

  const currentPreview =
    previewImage !== null ? previewImage : session.user.image || "";

  const userRole = session.user.role || session.user.userType || "developer";

  const dashboardHref = `/dashboard/${userRole.toLowerCase()}`;

  const roleLabel =
    {
      developer: "Developer",
      mentor: "Mentor",
      admin: "Admin",
    }[userRole.toLowerCase()] || userRole;

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      )
    ) {
      toast.error("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    // Release the previous temporary preview if one exists.
    if (previewImage?.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      return currentImage;
    }

    if (!IMGBB_API_KEY) {
      throw new Error(
        "Image upload is not configured. Add NEXT_PUBLIC_IMGBB_API_KEY to .env.local.",
      );
    }

    const formData = new FormData();
    formData.append("image", selectedImage);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok || !data?.success || !data?.data?.url) {
      throw new Error("Failed to upload your profile picture.");
    }

    return data.data.url;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentName.trim()) {
      toast.error("Name is required.");
      return;
    }

    if (!session.user.email) {
      toast.error("Please sign in again.");
      return;
    }

    try {
      setSaving(true);

      const imageUrl = await uploadImage();

      // This endpoint must exist in your SkillGraph Express backend.
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          name: currentName.trim(),
          image: imageUrl || "",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update your profile.");
      }

      // Keep the saved values visible immediately.
      setName(currentName.trim());
      setImage(imageUrl || "");
      setPreviewImage(imageUrl || "");
      setSelectedImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setName(null);
    setImage(null);

    if (previewImage?.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    setPreviewImage(null);
    setSelectedImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  return (
    <div className="min-h-full px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-7">
        {/* Header */}
        <div>
          <Link
            href={dashboardHref}
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-violet-600"
          >
            <FiArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <FiUser size={22} />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                My Profile
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your SkillGraph account information.
              </p>
            </div>
          </div>
        </div>

        {/* Profile summary */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-700 via-violet-600 to-indigo-700 p-6 text-white shadow-lg shadow-violet-200/50 sm:p-8">
          <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full border-30 border-white/10" />

          <div className="relative flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative shrink-0">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/25 bg-white/15">
                {currentPreview ? (
                  <Image
                    src={currentPreview}
                    alt="Profile"
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FiUser size={48} className="text-white/70" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile picture"
                className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-violet-700 bg-white text-violet-700 transition hover:bg-violet-50"
              >
                <FiCamera size={17} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="min-w-0 text-center sm:text-left">
              <p className="text-sm text-violet-100">Welcome to SkillGraph</p>

              <h2 className="mt-1 wrap-break text-2xl font-bold">
                {currentName || "Your Name"}
              </h2>

              <p className="mt-1 break-all text-sm text-violet-100">
                {session.user.email}
              </p>

              <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold">
                <FiShield size={13} />
                {roleLabel}
              </span>
            </div>
          </div>

          <p className="relative mt-6 border-t border-white/15 pt-4 text-xs text-violet-100">
            JPG, PNG or WEBP · Maximum 5 MB
          </p>
        </div>

        {/* Editable profile */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold">Personal Information</h2>
            <p className="mt-1 text-sm text-slate-500">
              Update your name and profile picture.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Account Role
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <FiShield className="text-violet-600" size={18} />

                <span className="text-sm font-medium text-slate-700">
                  {roleLabel}
                </span>

                <span className="ml-auto rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                  Read only
                </span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="profile-name"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <FiUser className="text-violet-600" />
                Full Name
              </label>

              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                value={currentName}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="profile-email"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <FiMail className="text-violet-600" />
                Email Address
              </label>

              <input
                id="profile-email"
                type="email"
                value={session.user.email || ""}
                readOnly
                aria-readonly="true"
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
              />

              <p className="mt-2 text-xs text-slate-500">
                Your registered email cannot be changed.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Discard Changes
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <FiLoader className="animate-spin" size={17} />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={17} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

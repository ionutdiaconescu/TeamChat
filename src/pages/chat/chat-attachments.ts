type AttachmentCallback<TArgs extends unknown[]> = (
  ...args: TArgs
) => void | Promise<void>;

type UploadHandlerConfig = {
  readErrorMessage: string;
  selectedFriendErrorMessage: string;
  validateFile?: (file: File, fileInput: HTMLInputElement) => boolean;
  onReady: (dataUrl: string, file: File) => void | Promise<void>;
};

export type ChatAttachmentsConfig = {
  attachmentMenuButton: HTMLElement | null;
  attachmentMenu: HTMLElement | null;
  attachImageOption: HTMLElement | null;
  attachDocumentOption: HTMLElement | null;
  imageInput: HTMLInputElement | null;
  documentInput: HTMLInputElement | null;
  audioRecordBtn: HTMLElement | null;
  getSelectedFriendId: () => string | null;
  onImageSelected: AttachmentCallback<[imageUrl: string, imageName: string]>;
  onDocumentSelected: AttachmentCallback<[documentUrl: string, file: File]>;
  onAudioReady: AttachmentCallback<
    [audioUrl: string, audioDurationSec: number, mimeType: string]
  >;
};

export type ChatAttachmentsController = {
  closeAttachmentMenu: () => void;
  toggleAttachmentMenu: () => void;
  destroy: () => void;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
const MAX_AUDIO_BYTES = 3 * 1024 * 1024;
const MAX_AUDIO_DURATION_MS = 30_000;

export function initChatAttachments(
  config: ChatAttachmentsConfig,
): ChatAttachmentsController {
  const {
    attachmentMenuButton,
    attachmentMenu,
    attachImageOption,
    attachDocumentOption,
    imageInput,
    documentInput,
    audioRecordBtn,
    getSelectedFriendId,
    onImageSelected,
    onDocumentSelected,
    onAudioReady,
  } = config;

  let isRecordingAudio = false;
  let mediaRecorder: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;
  let recordedAudioChunks: Blob[] = [];
  let recordingStartedAt = 0;
  let stopRecordingTimeout: ReturnType<typeof setTimeout> | null = null;

  const hasAttachmentMenuElements = () =>
    Boolean(attachmentMenu && attachmentMenuButton);

  const setAttachmentMenuState = (isOpen: boolean) => {
    if (!hasAttachmentMenuElements()) {
      return;
    }

    attachmentMenu!.classList.toggle("active", isOpen);
    attachmentMenu!.setAttribute("aria-hidden", String(!isOpen));
    attachmentMenuButton!.setAttribute("aria-expanded", String(isOpen));
  };

  const ensureSelectedFriend = (alertMessage: string) => {
    if (!getSelectedFriendId()) {
      alert(alertMessage);
      return false;
    }

    return true;
  };

  const resetAndOpenFilePicker = (fileInput: HTMLInputElement) => {
    fileInput.value = "";
    fileInput.click();
  };

  const readBlobAsDataUrl = (blob: Blob, errorMessage: string) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (loadEvent) => {
        resolve((loadEvent.target?.result as string) || "");
      };

      reader.onerror = () => {
        alert(errorMessage);
        reject(new Error(errorMessage));
      };

      reader.readAsDataURL(blob);
    });
  };

  const closeAttachmentMenu = () => {
    setAttachmentMenuState(false);
  };

  const toggleAttachmentMenu = () => {
    if (!hasAttachmentMenuElements()) {
      return;
    }

    const isOpen = attachmentMenu!.classList.contains("active");
    setAttachmentMenuState(!isOpen);
  };

  const handleAttachmentMenuOutsideClick = (event: MouseEvent) => {
    if (!attachmentMenu || !attachmentMenuButton) {
      return;
    }

    const target = event.target as Node;
    if (
      attachmentMenu.classList.contains("active") &&
      !attachmentMenu.contains(target) &&
      !attachmentMenuButton.contains(target)
    ) {
      closeAttachmentMenu();
    }
  };

  const invokeAsync = async (
    callback: () => void | Promise<void>,
    errorMessage: string,
  ) => {
    try {
      await callback();
    } catch (error) {
      console.error(errorMessage, error);
      alert("Something went wrong. Please try again.");
    }
  };

  const createUploadHandler = ({
    readErrorMessage,
    selectedFriendErrorMessage,
    validateFile,
    onReady,
  }: UploadHandlerConfig) => {
    return (event: Event) => {
      const fileInput = event.target as HTMLInputElement;
      const file = fileInput.files?.[0];
      if (!file) return;

      if (!ensureSelectedFriend(selectedFriendErrorMessage)) {
        fileInput.value = "";
        return;
      }

      if (validateFile && !validateFile(file, fileInput)) {
        return;
      }

      void invokeAsync(async () => {
        const dataUrl = await readBlobAsDataUrl(file, readErrorMessage);
        await onReady(dataUrl, file);
      }, "Attachment upload handler failed:");
    };
  };

  const handleImageUpload = createUploadHandler({
    readErrorMessage: "Image could not be read. Please try another file.",
    selectedFriendErrorMessage: "Please select a friend to chat with!",
    validateFile: (file, fileInput) => {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        fileInput.value = "";
        return false;
      }

      if (file.size > MAX_IMAGE_BYTES) {
        alert("Image size must be less than 5MB.");
        fileInput.value = "";
        return false;
      }

      return true;
    },
    onReady: (imageUrl, file) => onImageSelected(imageUrl, file.name),
  });

  const handleDocumentUpload = createUploadHandler({
    readErrorMessage: "Document could not be read. Please try another file.",
    selectedFriendErrorMessage: "Please select a friend to chat with!",
    validateFile: (file, fileInput) => {
      if (file.size > MAX_DOCUMENT_BYTES) {
        alert("Document size must be less than 2MB.");
        fileInput.value = "";
        return false;
      }

      return true;
    },
    onReady: (documentUrl, file) => onDocumentSelected(documentUrl, file),
  });

  const updateAudioRecordButtonState = () => {
    if (!audioRecordBtn) return;

    audioRecordBtn.classList.toggle("recording", isRecordingAudio);
    audioRecordBtn.setAttribute(
      "aria-label",
      isRecordingAudio ? "Stop audio recording" : "Start audio recording",
    );

    const audioIcon = audioRecordBtn.querySelector("ion-icon");
    if (audioIcon) {
      audioIcon.setAttribute(
        "name",
        isRecordingAudio ? "stop-circle-outline" : "mic-outline",
      );
    }
  };

  const cleanupAudioStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
  };

  const stopAudioRecording = () => {
    if (!mediaRecorder || mediaRecorder.state !== "recording") {
      return;
    }

    if (stopRecordingTimeout) {
      clearTimeout(stopRecordingTimeout);
      stopRecordingTimeout = null;
    }

    mediaRecorder.stop();
  };

  const onAudioRecordButtonClick = async () => {
    if (
      !ensureSelectedFriend("Please select a friend before recording audio.")
    ) {
      return;
    }

    if (isRecordingAudio) {
      stopAudioRecording();
      return;
    }

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      alert("Audio recording is not supported in this browser.");
      return;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus",
      )
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      mediaRecorder = preferredMimeType
        ? new MediaRecorder(mediaStream, { mimeType: preferredMimeType })
        : new MediaRecorder(mediaStream);

      recordedAudioChunks = [];
      recordingStartedAt = Date.now();

      mediaRecorder.ondataavailable = (recordingEvent) => {
        if (recordingEvent.data.size > 0) {
          recordedAudioChunks.push(recordingEvent.data);
        }
      };

      mediaRecorder.onstop = () => {
        const durationMs = Date.now() - recordingStartedAt;
        const mimeType = mediaRecorder?.mimeType || "audio/webm";
        const audioBlob = new Blob(recordedAudioChunks, { type: mimeType });

        isRecordingAudio = false;
        updateAudioRecordButtonState();
        cleanupAudioStream();

        if (audioBlob.size === 0) {
          return;
        }

        if (audioBlob.size > MAX_AUDIO_BYTES) {
          alert("Audio is too large. Keep recordings under 30 seconds.");
          return;
        }

        void invokeAsync(async () => {
          const audioUrl = await readBlobAsDataUrl(
            audioBlob,
            "Audio could not be processed. Please try again.",
          );
          await onAudioReady(audioUrl, Math.round(durationMs / 1000), mimeType);
        }, "Audio send handler failed:");
      };

      mediaRecorder.start();
      isRecordingAudio = true;
      updateAudioRecordButtonState();

      stopRecordingTimeout = setTimeout(() => {
        stopAudioRecording();
      }, MAX_AUDIO_DURATION_MS);
    } catch (error) {
      cleanupAudioStream();
      isRecordingAudio = false;
      updateAudioRecordButtonState();
      alert("Microphone permission is required to record audio.");
      console.error("Audio recording error:", error);
    }
  };

  const onAttachImageOptionClick = () => {
    if (!imageInput) {
      return;
    }

    if (
      !ensureSelectedFriend("Please select a friend before sending an image.")
    ) {
      return;
    }

    closeAttachmentMenu();
    resetAndOpenFilePicker(imageInput);
  };

  const onAttachDocumentOptionClick = () => {
    if (!documentInput) {
      return;
    }

    if (
      !ensureSelectedFriend("Please select a friend before sending a document.")
    ) {
      return;
    }

    closeAttachmentMenu();
    resetAndOpenFilePicker(documentInput);
  };

  if (attachmentMenuButton && attachmentMenu) {
    attachmentMenuButton.addEventListener("click", toggleAttachmentMenu);
  }

  if (attachImageOption && imageInput) {
    attachImageOption.addEventListener("click", onAttachImageOptionClick);

    imageInput.addEventListener("change", handleImageUpload);
  }

  if (attachDocumentOption && documentInput) {
    attachDocumentOption.addEventListener("click", onAttachDocumentOptionClick);

    documentInput.addEventListener("change", handleDocumentUpload);
  }

  document.addEventListener("mousedown", handleAttachmentMenuOutsideClick);

  if (audioRecordBtn) {
    audioRecordBtn.addEventListener("click", onAudioRecordButtonClick);
  }

  const destroy = () => {
    if (attachmentMenuButton && attachmentMenu) {
      attachmentMenuButton.removeEventListener("click", toggleAttachmentMenu);
    }

    if (imageInput) {
      imageInput.removeEventListener("change", handleImageUpload);
    }

    if (attachImageOption) {
      attachImageOption.removeEventListener("click", onAttachImageOptionClick);
    }

    if (documentInput) {
      documentInput.removeEventListener("change", handleDocumentUpload);
    }

    if (attachDocumentOption) {
      attachDocumentOption.removeEventListener(
        "click",
        onAttachDocumentOptionClick,
      );
    }

    if (audioRecordBtn) {
      audioRecordBtn.removeEventListener("click", onAudioRecordButtonClick);
    }

    document.removeEventListener("mousedown", handleAttachmentMenuOutsideClick);

    if (isRecordingAudio) {
      stopAudioRecording();
    }
    cleanupAudioStream();
  };

  return {
    closeAttachmentMenu,
    toggleAttachmentMenu,
    destroy,
  };
}

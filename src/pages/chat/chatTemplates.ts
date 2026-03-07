import { createDebouncedFunction } from "../../common/utils";
import { getLoggedInUser } from "../../services/auth-service/auth.service";
import { createDomElement } from "../../services/dom.service";
import { searchUsersInDatabase } from "../../services/user-service/user.service";
import { User } from "../../services/user-service/user.service.types";
export const createMessageBubble = (
  message: string,
  time: string,
  direction: "left" | "right",
  user: string,
  imageUrl?: string,
  documentUrl?: string,
  documentName?: string,
  audioUrl?: string,
): HTMLElement => {
  const userElem = createDomElement("div", "user", user);
  const textElem = createDomElement("div", "text", message);
  const timeElem = createDomElement(
    "div",
    "timestamp",
    time
      ? new Intl.DateTimeFormat("en-US", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(time))
      : "",
  );

  const elements = [userElem, textElem, timeElem];

  // Add image if provided
  if (imageUrl) {
    const imageElem = createDomElement(
      "img",
      "message-image",
    ) as HTMLImageElement;
    imageElem.src = imageUrl;
    imageElem.alt = "Shared image";
    imageElem.onclick = () => {
      // Open image in new tab when clicked
      window.open(imageUrl, "_blank");
    };
    elements.splice(1, 0, imageElem); // Insert image between user and text
  }

  if (documentUrl) {
    const documentLink = createDomElement(
      "a",
      "message-document-link",
      documentName || "Download document",
    ) as HTMLAnchorElement;
    documentLink.href = documentUrl;
    documentLink.target = "_blank";
    documentLink.rel = "noopener noreferrer";
    documentLink.download = documentName || "document";

    const documentWrapper = createDomElement(
      "div",
      "message-document",
      "",
      undefined,
      [documentLink],
    );
    elements.splice(1, 0, documentWrapper);
  }

  if (audioUrl) {
    const audioElem = createDomElement(
      "audio",
      "message-audio",
    ) as HTMLAudioElement;
    audioElem.controls = true;
    audioElem.preload = "metadata";
    audioElem.src = audioUrl;
    elements.splice(1, 0, audioElem);
  }

  const bubble = createDomElement(
    "div",
    `message ${direction}`,
    "",
    undefined,
    elements,
  );

  return bubble;
};

export const createFriendItem = (
  name: string,
  email: string,
  status: string,
  onRemove: () => void,
  friendId: string,
  onSelect?: () => void,
): HTMLElement => {
  const avatar = createDomElement(
    "div",
    `avatar ${status === "online" ? "avatar-online" : "avatar-offline"}`,
    "",
  );

  const nameSpan = createDomElement("span", "name", name);

  const emailSpan = createDomElement("span", "email", email);

  const info = createDomElement("div", "friend-info", "", undefined, [
    nameSpan,
    emailSpan,
  ]);

  //remove friend button
  const removeBtn = createDomElement("button", "remove-friend-btn", "");
  removeBtn.title = "Remove friend";
  removeBtn.innerHTML = '<ion-icon name="close-outline"></ion-icon>';

  if (friendId === getLoggedInUser()?.uid) {
    removeBtn.classList.add("hidden");
  } else {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const confirmModal = createRemoveFriendModal(
        name,
        () => {
          onRemove();
          document.body.removeChild(confirmModal);
        },
        () => {
          document.body.removeChild(confirmModal);
        },
      );
      document.body.appendChild(confirmModal);
    });
  }

  const item = createDomElement("li", "friend", "", undefined, [
    avatar,
    info,
    removeBtn,
  ]);

  // Add click handler for friend selection
  if (onSelect) {
    item.addEventListener("click", (e) => {
      // Don't trigger selection if clicking remove button
      if (!(e.target as HTMLElement).closest(".remove-friend-btn")) {
        onSelect();
      }
    });
  }

  return item;
};
export const createAddFriendButton = (onClick: () => void): HTMLElement => {
  const btn = document.createElement("button");
  btn.className = "btn btn-primary add-friend-btn";
  btn.textContent = "Add Friend";
  btn.type = "button";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
};

export const createAddFriendModal = (
  onConfirm: (email: string) => Promise<void>,
  onCancel?: () => void,
): HTMLElement => {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
      <div class="modal add-friend-modal">
        <h3>Add friend</h3>
        <div class="search-container">
          <input type="text" id="search-users-input" placeholder="Search users by name or email..." />
          <div id="search-results" class="search-results hidden"></div>
        </div>
        <div class="modal-actions">
          <button id="cancel-add">Cancel</button>
        </div>
        <p id="add-error" class="error"></p>
      </div>
    `;

  // Nu mai există input pentru email direct
  const searchInput = overlay.querySelector<HTMLInputElement>(
    "#search-users-input",
  )!;
  const searchResults = overlay.querySelector<HTMLElement>("#search-results")!;
  const errBox = overlay.querySelector<HTMLElement>("#add-error")!;

  // Funcția pentru căutarea de utilizatori
  const handleUserSearch = async (searchTerm: string) => {
    try {
      if (!searchTerm.trim()) {
        searchResults.classList.add("hidden");
        searchResults.innerHTML = "";
        return;
      }

      const users = await searchUsersInDatabase(searchTerm);
      displaySearchResults(users);
    } catch (error: any) {
      console.error("Error searching users:", error);
      errBox.textContent = error.message || "Error searching users";
    }
  };

  // Function for displaying search results
  const displaySearchResults = (users: User[]) => {
    if (users.length === 0) {
      searchResults.innerHTML = '<div class="no-results">No users found</div>';
    } else {
      searchResults.innerHTML = users
        .slice(0, 5) // Limităm la 5 rezultate
        .map(
          (user) => `
          <div class="search-result-item" data-user-id="${user.id}" data-user-email="${user.email}">
            <div class="user-info">
              <span class="user-name">${user.name}</span>
              <span class="user-email">${user.email}</span>
            </div>
            <button class="add-user-btn" data-user-id="${user.id}">Add</button>
          </div>
        `,
        )
        .join("");

      // We add event listeners for the add buttons
      searchResults.querySelectorAll(".add-user-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const userId = (e.target as HTMLElement).dataset.userId;
          const userItem = searchResults.querySelector(
            `[data-user-id="${userId}"]`,
          ) as HTMLElement;
          const userEmail = userItem?.dataset.userEmail;

          if (userEmail) {
            try {
              await onConfirm(userEmail);
              overlay.remove();
            } catch (error: any) {
              errBox.textContent = error.message;
            }
          }
        });
      });
    }

    searchResults.classList.remove("hidden");
  };

  // Event listener for debouncing search
  searchInput.addEventListener(
    "input",
    createDebouncedFunction((e: Event) => {
      const input = e.target as HTMLInputElement;
      console.log(input.value);
      handleUserSearch(input.value);
    }),
  );

  // Event listener for clicks outside of results
  overlay.addEventListener("click", (e) => {
    if (!searchResults.contains(e.target as Node) && e.target !== searchInput) {
      searchResults.classList.add("hidden");
    }
  });

  overlay.querySelector("#cancel-add")!.addEventListener("click", () => {
    overlay.remove();
    if (onCancel) onCancel();
  });

  return overlay;
};

export const createRemoveFriendModal = (
  friendName: string,
  onConfirm: () => void,
  onCancel?: () => void,
): HTMLElement => {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal remove-friend-modal">
      <div class="modal-header">
        <ion-icon name="warning-outline" class="warning-icon"></ion-icon>
        <h3>Remove Friend</h3>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to remove <strong>${friendName}</strong> from your friends list?</p>
        <p class="modal-subtitle">This action cannot be undone.</p>
      </div>
      <div class="modal-actions">
        <button id="cancel-remove" class="cancel-remove">Cancel</button>
        <button id="confirm-remove" class="confirm-remove">Remove Friend</button>
      </div>
    </div>
  `;

  // Event listeners
  overlay.querySelector("#cancel-remove")!.addEventListener("click", () => {
    overlay.remove();
    if (onCancel) onCancel();
  });

  overlay.querySelector("#confirm-remove")!.addEventListener("click", () => {
    onConfirm();
    overlay.remove();
  });

  // Close modal on click on overlay
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (onCancel) onCancel();
    }
  });

  return overlay;
};

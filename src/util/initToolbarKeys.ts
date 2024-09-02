import {AiEditorOptions, CustomMenu, InnerEditor, MenuGroup} from "../core/AiEditor.ts";
import {AbstractMenuButton} from "../components/AbstractMenuButton.ts";
import {t} from "i18next";
import tippy from "tippy.js";
import {Group} from "../components/menus/Group.ts";
import {Custom} from "../components/menus/Custom.ts";
import {EditorEvents} from "@tiptap/core";

export const initToolbarKeys = (event: EditorEvents["create"],
                                options: AiEditorOptions,
                                menuButtons: AbstractMenuButton[],
                                toolbarKeys: (string | CustomMenu | MenuGroup)[]) => {

    for (let toolbarKey of toolbarKeys) {
        if (!toolbarKey) continue;

        try {
            if (typeof toolbarKey === "string") {
                toolbarKey = toolbarKey.trim();
                if (toolbarKey === "|") {
                    toolbarKey = "divider"
                }
                const menuButton = document.createElement("aie-" + toolbarKey) as AbstractMenuButton;
                menuButton.classList.add("aie-menu-item")
                menuButton.onCreate(event, options);

                if (toolbarKey !== "divider") {
                    const tip = t(toolbarKey) as string;
                    menuButton.setAttribute("data-title", tip);
                    tip && tippy(menuButton, {
                        appendTo: () => event.editor.view.dom.closest(".aie-container")!,
                        content: tip,
                        theme: 'aietip',
                        arrow: true,
                        // trigger:"click",
                        // interactive:true,
                    });
                }
                menuButtons.push(menuButton);
            } else {
                //menu group
                if ((toolbarKey as any).toolbarKeys) {
                    const mg = toolbarKey as MenuGroup;
                    const menuButton = document.createElement("aie-group") as Group;
                    menuButton.classList.add("aie-menu-item")
                    menuButton.onCreate(event, options);
                    menuButton.initToolbarKeys(event, options, mg.toolbarKeys);

                    const tip = t(mg.title || "menu-group") as string;
                    tip && tippy(menuButton, {
                        appendTo: () => event.editor.view.dom.closest(".aie-container")!,
                        content: tip,
                        theme: 'aietip',
                        arrow: true,
                        // trigger:"click",
                        // interactive:true,
                    });
                    menuButtons.push(menuButton);
                }
                // custom menu
                else {
                    const customMenuConfig = toolbarKey as CustomMenu;
                    const menuButton = document.createElement("aie-custom") as Custom;
                    menuButton.classList.add("aie-menu-item")
                    if (customMenuConfig.id) {
                        menuButton.setAttribute("id", customMenuConfig.id);
                    }
                    if (customMenuConfig.className) {
                        menuButton.classList.add(customMenuConfig.className);
                    }
                    menuButton.onCreate(event, options);
                    menuButton.onConfig(customMenuConfig);

                    if (customMenuConfig.tip) {
                        const tip = t(customMenuConfig.tip) as string;
                        tip && tippy(menuButton, {
                            appendTo: () => event.editor.view.dom.closest(".aie-container")!,
                            content: tip,
                            theme: 'aietip',
                            arrow: true,
                            // trigger:"click",
                            // interactive:true,
                        });
                    }

                    if (customMenuConfig.onCreate) {
                        customMenuConfig.onCreate(menuButton, (event.editor as InnerEditor).aiEditor);
                    }

                    menuButtons.push(menuButton);
                }
            }
        } catch (e) {
            console.error("Can not create toolbar by key: " + toolbarKey);
        }
    }
}
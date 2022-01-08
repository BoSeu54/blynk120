const token = document.getElementById("token");
let tokenIsValid = false;

function tokenInputInit() {
    const device_name = document.getElementById("device-name");
    const token_message_error = document.getElementById("token-message-error");
    const event_change = new Event("change");
    const event_get_update = new Event('get_update');
    let interval_id = '';
    let interval_is_set = false;

    const interval_set_update = () => {
        if (!interval_is_set) {
            interval_id = setInterval(() => {
                for (const datasteam_pin of document.getElementsByClassName("datasteam-pin")) {
                    datasteam_pin.dispatchEvent(event_get_update);
                }
            }, 100);
            interval_is_set = true;
        }
    };

    const interval_unset_update = () => {
        if (interval_is_set) {
            clearInterval(interval_id);
            interval_is_set = false;
        }
    };

    const datasteam_pin_value_update = () => {
        for (const datasteam_pin of document.getElementsByClassName("datasteam-pin")) {
            datasteam_pin.dispatchEvent(event_change);
        }
    };

    device_name.value = "";
    token_message_error.classList.add("message-error");

    token.addEventListener("input", interval_unset_update);
    token.addEventListener("change", async () => {
        if (token.value == "") {
            device_name.value = "";
            token_message_error.innerHTML = "";
            tokenIsValid = false;
            datasteam_pin_value_update();
            return;
        }

        const device_name_response = await fetch('https://blynk.cloud/external/api/device/meta?token=' + token.value + '&metaFieldId=1');
        const device_name_json = await device_name_response.json();
        if (device_name_json.error != undefined) {
            device_name.value = "";
            token_message_error.innerHTML = device_name_json.error.message;
            tokenIsValid = false;
            datasteam_pin_value_update();
            return;
        }

        device_name.value = device_name_json.value;
        token_message_error.innerHTML = "";
        tokenIsValid = true;
        datasteam_pin_value_update();
        interval_set_update();
    });
}

function createWidgetSlider(widget_element) {
    const datasteam_pin = document.createElement("input");
    const slider_bar = document.createElement("input");
    const slider_bar_indicator = document.createElement("output");
    const datasteam_pin_message_error = document.createElement("label");

    datasteam_pin.classList.add("datasteam-pin");
    datasteam_pin.placeholder = "Pin";

    slider_bar.classList.add("widget-slider-bar");
    slider_bar.type = "range";

    datasteam_pin_message_error.classList.add("message-error");

    let slider_bar_is_hover = false;

    const slider_bar_reset = () => {
        datasteam_pin.removeEventListener("get_update", datasteam_get_update);
        slider_bar.removeEventListener("input", slider_bar_indicator_get_update);
        slider_bar.removeEventListener("mouseenter", datasteam_pin_unset_update);
        slider_bar.removeEventListener("mouseleave", datasteam_pin_set_update);
        slider_bar.value = 0;
        slider_bar.disabled = true;
        slider_bar_indicator.value = 0;
    };

    const datasteam_get_update = async () => {
        const datasteam_value_response = await fetch('https://blynk.cloud/external/api/get?token=' + token.value + '&' + datasteam_pin.value);
        const datasteam_value = await datasteam_value_response.json();
        if (datasteam_value != slider_bar.value) {
            slider_bar.value = slider_bar_indicator.value = datasteam_value;
        }
    };

    const datasteam_pin_set_update = () => {
        datasteam_pin.addEventListener("get_update", datasteam_get_update);
    };

    const datasteam_pin_unset_update = () => {
        datasteam_pin.removeEventListener("get_update", datasteam_get_update);
    };

    const slider_bar_indicator_get_update = () => {
        slider_bar_indicator.value = slider_bar.value;
    };

    datasteam_pin.addEventListener("input", () => {
        datasteam_pin.removeEventListener("get_update", datasteam_get_update)
    });

    datasteam_pin.addEventListener("change", async () => {
        if (!tokenIsValid || datasteam_pin.value == "") {
            slider_bar_reset();
            datasteam_pin_message_error.innerHTML = "";
            return;
        }

        const datasteam_value_response = await fetch('https://blynk.cloud/external/api/get?token=' + token.value + '&' + datasteam_pin.value);
        const datasteam_value = await datasteam_value_response.json();
        if (datasteam_value.error != undefined) {
            slider_bar_reset();
            datasteam_pin_message_error.innerHTML = datasteam_value.error.message;
            return;
        }

        // Retrieve the maximum value of the datastream.
        await fetch('https://blynk.cloud/external/api/update?token=' + token.value + '&' + datasteam_pin.value + '=1000000000000000');
        const datasteam_max_response = await fetch('https://blynk.cloud/external/api/get?token=' + token.value + '&' + datasteam_pin.value);
        const datasteam_max = await datasteam_max_response.json();

        // Retrieves the minimum value of the datastream.
        await fetch('https://blynk.cloud/external/api/update?token=' + token.value + '&' + datasteam_pin.value + '=-1000000000000000');
        const datasteam_min_response = await fetch('https://blynk.cloud/external/api/get?token=' + token.value + '&' + datasteam_pin.value);
        const datasteam_min = await datasteam_min_response.json();

        // Restore the original datasteam.
        await fetch('https://blynk.cloud/external/api/update?token=' + token.value + '&' + datasteam_pin.value + '=' + datasteam_value);

        datasteam_pin_message_error.innerHTML = "";
        slider_bar.max = datasteam_max;
        slider_bar.min = datasteam_min;
        slider_bar.value = slider_bar_indicator.value = datasteam_value;
        slider_bar.disabled = false;

        slider_bar.addEventListener("input", slider_bar_indicator_get_update);
        slider_bar.addEventListener("mouseenter", datasteam_pin_unset_update);
        slider_bar.addEventListener("mouseleave", datasteam_pin_set_update);

        if (!slider_bar_is_hover) {
            datasteam_pin.addEventListener("get_update", datasteam_get_update);
        }
    });

    slider_bar.addEventListener("change", async () => {
        await fetch('https://blynk.cloud/external/api/update?token=' + token.value + '&' + datasteam_pin.value + '=' + slider_bar.value);
    });

    slider_bar.addEventListener("mouseenter", () => {
        slider_bar_is_hover = true;
    });
    slider_bar.addEventListener("mouseleave", () => {
        slider_bar_is_hover = false;
    });

    slider_bar_reset();

    widget_element.appendChild(datasteam_pin);
    widget_element.appendChild(slider_bar);
    widget_element.appendChild(slider_bar_indicator);
    widget_element.appendChild(document.createElement("br"));
    widget_element.appendChild(datasteam_pin_message_error);
}

function createWidgetSwitch(widget_element) {
    const datasteam_pin = document.createElement("input");
    const toggle_switch = document.createElement("label");
    const toggle_switch_value = document.createElement("input");
    const toggle_switch_slider = document.createElement("span");
    const datasteam_pin_message_error = document.createElement("label");

    datasteam_pin.classList.add("datasteam-pin");
    datasteam_pin.placeholder = "Pin";

    toggle_switch.classList.add("toggle-switch");
    toggle_switch_value.type = "checkbox";

    toggle_switch_value.classList.add("toggle-switch-value");
    toggle_switch_slider.classList.add("toggle-switch-slider");
    datasteam_pin_message_error.classList.add("message-error");

    let toggle_switch_is_hover = false;

    const toggle_switch_reset = () => {
        datasteam_pin.removeEventListener("get_update", datasteam_get_update);
        toggle_switch_value.removeEventListener("change", datasteam_set_update);
        toggle_switch_value.checked = false;
    };

    const datasteam_get_update = async () => {
        const datasteam_value_response = await fetch('https://blynk.cloud/external/api/get?token=' + token.value + '&' + datasteam_pin.value);
        const datasteam_value = await datasteam_value_response.json();
        if (datasteam_value != toggle_switch_value) {
            toggle_switch_value.checked = datasteam_value;
        }
    }

    const datasteam_set_update = async () => {
        const toggle_switch_value_int = toggle_switch_value.checked ? 1 : 0;
        await fetch('https://blynk.cloud/external/api/update?token=' + token.value + '&' + datasteam_pin.value + '=' + toggle_switch_value_int);
    }

    const datasteam_pin_set_update = () => {
        datasteam_pin.addEventListener("get_update", datasteam_get_update);
    };

    const datasteam_pin_unset_update = () => {
        datasteam_pin.removeEventListener("get_update", datasteam_get_update);
    };

    datasteam_pin.addEventListener("input", () => {
        datasteam_pin.removeEventListener("get_update", datasteam_get_update)
    });
    datasteam_pin.addEventListener("change", async () => {
        if (!tokenIsValid || datasteam_pin.value == "") {
            toggle_switch_reset();
            datasteam_pin_message_error.innerHTML = "";
            return;
        }

        const datasteam_value_response = await fetch('https://blynk.cloud/external/api/get?token=' + token.value + '&' + datasteam_pin.value);
        const datasteam_value = await datasteam_value_response.json();
        if (datasteam_value.error != undefined) {
            toggle_switch_reset();
            datasteam_pin_message_error.innerHTML = datasteam_value.error.message;
            return;
        }

        datasteam_pin_message_error.innerHTML = "";
        toggle_switch_value.checked = datasteam_value;

        toggle_switch_value.addEventListener("change", datasteam_set_update);
        toggle_switch.addEventListener("mouseenter", datasteam_pin_unset_update);
        toggle_switch.addEventListener("mouseleave", datasteam_pin_set_update);

        if (!toggle_switch_is_hover) {
            datasteam_pin.addEventListener('get_update', datasteam_get_update);
        }
    });

    toggle_switch.addEventListener("mouseenter", () => {
        toggle_switch_is_hover = true;
    });

    toggle_switch.addEventListener("mouseleave", () => {
        toggle_switch_is_hover = false;
    });

    toggle_switch.appendChild(toggle_switch_value);
    toggle_switch.appendChild(toggle_switch_slider);

    widget_element.appendChild(datasteam_pin);
    widget_element.appendChild(toggle_switch);
    widget_element.appendChild(document.createElement("br"));
    widget_element.appendChild(datasteam_pin_message_error);
}

tokenInputInit();

for (const datasteam of document.getElementsByClassName("datasteam")) {
    if (datasteam.classList.contains("widget-slider")) {
        createWidgetSlider(datasteam);
    } else if (datasteam.classList.contains("widget-toggle-switch")) {
        createWidgetSwitch(datasteam);
    }
}
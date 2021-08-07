try {
    ClassicEditor.create(document.querySelector("textarea"), {
        simpleUpload: {
            uploadUrl: "/cdn/upload?code=true",
            withCredentials: true,
        },
    }).then((editor) => {
        const wordCountPlugin = editor.plugins.get("WordCount");
        const wordCountWrapper = document.getElementById("word-count-wrapper");

        wordCountWrapper.appendChild(wordCountPlugin.wordCountContainer);

        editor.ui.view.editable.element.style.resize = "vertical";
        editor.ui.view.editable.element.style.overflowY = "auto";
    });
} catch (e) {
    console.error(e);
}

const media = await fetch("/api/media").then((res) => res.json());

var app = new Vue({
    el: "#manage",
    data: {
        media: media,
    },
    methods: {
        getMedia: async function () {
            const data = await fetch("/api/media").then((res) => res.json());
            this.media = data;
        },

        copyUrl: function (url) {
            navigator.clipboard.writeText(url);
        },
        onFile: async function (e) {
            var formData = new FormData();
            formData.append("file", e.target.files[0]);

            await fetch("/cdn/upload", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            await this.getMedia();
        },
    },
});

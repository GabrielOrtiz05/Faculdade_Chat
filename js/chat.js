// ======================================
// SUPABASE
// ======================================


const SUPABASE_URL =
"https://shdiawaqacvhtsigpidg.supabase.co";

const SUPABASE_KEY =
"sb_publishable_OwmxEctTMBA0UHXJXHOPPA_zr2DVkY3";

const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ======================================
// ELEMENTOS
// ======================================

const listaConversasArea =
document.getElementById(
    "listaConversas"
);

const mensagensArea =
document.getElementById(
    "mensagensArea"
);

const nomeChatAtivo =
document.getElementById(
    "nomeChatAtivo"
);

const avatarChat =
document.getElementById(
    "avatarChat"
);

const inputMensagem =
document.getElementById(
    "inputMensagem"
);

const formMensagem =
document.getElementById(
    "formMensagem"
);

const btnEnviarMensagem =
document.getElementById(
    "btnEnviarMensagem"
);

const inputPesquisa =
document.getElementById(
    "inputPesquisaUsuario"
);

const inputArquivo =
document.getElementById(
    "inputArquivo"
);

const btnEmoji =
document.getElementById(
    "btnEmoji"
);

const emojiPicker =
document.getElementById(
    "emojiPicker"
);

// ======================================
// USUARIO
// ======================================

const usuarioLogadoId =
localStorage.getItem(
    "userId"
);

if(!usuarioLogadoId){

    window.location.href =
    "login.html";
}

// ======================================
// ESTADO GLOBAL
// ======================================

let chatAtivoId = null;

let realtimeChannel = null;

// ======================================
// EMOJIS
// ======================================

const emojis = [

    "😀","😁","😂","🤣","😊",
    "😍","🥰","😘","😎","🔥",
    "❤️","👍","👏","🎉","😭",
    "😡","🤯","🥶","🤔","😴",
    "👀","💀","🤝","✨","🚀"

];

emojiPicker.innerHTML = "";

emojis.forEach(emoji => {

    emojiPicker.innerHTML += `
    
        <span class="emoji-item">
            ${emoji}
        </span>
    
    `;
});

// TOGGLE EMOJI

btnEmoji.addEventListener(
    "click",
    () => {

        emojiPicker.classList.toggle(
            "d-none"
        );
    }
);

// CLICK EMOJI

document.addEventListener(
    "click",
    function(e){

        if(
            e.target.classList.contains(
                "emoji-item"
            )
        ){

            inputMensagem.value +=
            e.target.textContent;

            inputMensagem.focus();
        }
    }
);

// ======================================
// LISTAR CONVERSAS
// ======================================

async function carregarListaConversas(){

    const { data, error } =

    await supabaseClient

    .from("contact")

    .select("*")

    .or(
        `account_id.eq.${usuarioLogadoId},account_fk.eq.${usuarioLogadoId}`
    );

    if(error){

        console.error(error);
        return;
    }

    listaConversasArea.innerHTML = "";

    if(!data?.length){

        listaConversasArea.innerHTML = `
        
            <div class="p-4 text-center text-light opacity-50">
                Nenhuma conversa encontrada
            </div>
        
        `;

        return;
    }

    for(const contato of data){

        const outroId =

        contato.account_id ==
        usuarioLogadoId

            ? contato.account_fk
            : contato.account_id;

        const { data: usuario } =

        await supabaseClient

        .from("account")

        .select("*")

        .eq("id", outroId)

        .single();

        if(!usuario) continue;

        const nome =

        usuario.firstName ||
        usuario.userName;

        listaConversasArea.innerHTML += `

            <div
                class="chat-user"
                onclick="
                    abrirConversa(
                        ${contato.id},
                        '${nome}'
                    )
                "
            >

                <div class="avatar">
                    ${nome.charAt(0)}
                </div>

                <div class="chat-user-info">

                    <h6>${nome}</h6>

                    <small>
                        @${usuario.userName}
                    </small>

                </div>

            </div>

        `;
    }
}

// ======================================
// ABRIR CONVERSA
// ======================================

window.abrirConversa =
async function(contactId, nome){

    nomeChatAtivo.textContent =
    nome;

    avatarChat.textContent =
    nome.charAt(0);

    const { data: conversa } =

    await supabaseClient

    .from("conversation")

    .select("*")

    .eq("contact_fk", contactId)

    .maybeSingle();

    let conversaId = null;

    if(!conversa){

        const { data: novaConversa } =

        await supabaseClient

        .from("conversation")

        .insert({

            contact_fk:
            contactId,

            account_id:
            usuarioLogadoId,

            status: true

        })

        .select()

        .single();

        conversaId =
        novaConversa.id;

    }else{

        conversaId =
        conversa.id;
    }

    chatAtivoId =
    conversaId;

    carregarMensagens();

    ativarRealtime();
};

// ======================================
// CARREGAR MENSAGENS
// ======================================

async function carregarMensagens(){

    if(!chatAtivoId) return;

    const { data, error } =

    await supabaseClient

    .from("chat")

    .select("*")

    .eq(
        "conversation_fk",
        chatAtivoId
    )

    .order(
        "created_at",
        {
            ascending: true
        }
    );

    if(error){

        console.error(error);
        return;
    }

    mensagensArea.innerHTML = "";

    data.forEach(msg => {

        adicionarMensagemNaTela(
            msg
        );
    });

    scrollFinal();
}

// ======================================
// RENDER MENSAGEM
// ======================================

function adicionarMensagemNaTela(msg){

    const minha =

    msg.account_fk ==
    usuarioLogadoId;

    const classe =

    minha
        ? "mine"
        : "other";

    let conteudo = "";

    // IMAGEM

    if(msg.file_type === "image"){

        conteudo = `

            <div class="chat-image">

                <img
                    src="${msg.file_url}"
                    alt="Imagem"
                >

            </div>

        `;
    }

    // VIDEO

    else if(
        msg.file_type === "video"
    ){

        conteudo = `

            <div class="chat-video">

                <video controls>

                    <source
                        src="${msg.file_url}"
                    >

                </video>

            </div>

        `;
    }

    // AUDIO

    else if(
        msg.file_type === "audio"
    ){

        conteudo = `

            <div class="chat-audio">

                <audio controls>

                    <source
                        src="${msg.file_url}"
                    >

                </audio>

            </div>

        `;
    }

    // ARQUIVO

    else if(
        msg.file_type === "file"
    ){

        conteudo = `

            <a
                href="${msg.file_url}"
                target="_blank"
                class="chat-file"
            >

                <i class="bi bi-file-earmark"></i>

                <span>
                    ${msg.message}
                </span>

            </a>

        `;
    }

    // TEXTO

    else{

        conteudo = `

            <div class="chat-text">

                ${msg.message || ""}

            </div>

        `;
    }

    // HORA

    const hora =

    new Date(
        msg.created_at
    )
    .toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

    mensagensArea.innerHTML += `

        <div class="message ${classe}">

            ${conteudo}

            <span class="message-time">
                ${hora}
            </span>

        </div>

    `;
}

// ======================================
// SCROLL
// ======================================

function scrollFinal(){

    mensagensArea.scrollTop =
    mensagensArea.scrollHeight;
}

// ======================================
// REALTIME
// ======================================

function ativarRealtime(){

    if(realtimeChannel){

        supabaseClient.removeChannel(
            realtimeChannel
        );
    }

    realtimeChannel =

    supabaseClient

    .channel(
        `chat-${chatAtivoId}`
    )

    .on(
        "postgres_changes",

        {

            event: "INSERT",

            schema: "public",

            table: "chat",

            filter:
            `conversation_fk=eq.${chatAtivoId}`
        },

        payload => {

            adicionarMensagemNaTela(
                payload.new
            );

            scrollFinal();
        }
    )

    .subscribe();
}

// ======================================
// ENVIAR TEXTO
// ======================================

formMensagem.addEventListener(
    "submit",

    async function(e){

        e.preventDefault();

        const texto =
        inputMensagem.value.trim();

        if(
            !texto ||
            !chatAtivoId
        ) return;

        const { error } =

        await supabaseClient

        .from("chat")

        .insert({

            conversation_fk:
            chatAtivoId,

            account_fk:
            usuarioLogadoId,

            message: texto,

            file_type: "text"
        });

        if(error){

            console.error(error);
            return;
        }

        inputMensagem.value = "";
    }
);

// ======================================
// UPLOAD
// ======================================

inputArquivo.addEventListener(
    "change",

    async function(){

        const arquivo =
        this.files[0];

        if(!arquivo) return;

        const extensao =

        arquivo.name
        .split(".")
        .pop();

        const nomeArquivo =

        `${Date.now()}.${
            extensao
        }`;

        const { error: uploadError } =

        await supabaseClient

        .storage

        .from("chat-media")

        .upload(
            nomeArquivo,
            arquivo
        );

        if(uploadError){

            console.error(uploadError);
            return;
        }

        const { data } =

        supabaseClient

        .storage

        .from("chat-media")

        .getPublicUrl(
            nomeArquivo
        );

        let tipo = "file";

        if(
            arquivo.type.startsWith(
                "image/"
            )
        ){

            tipo = "image";
        }

        else if(
            arquivo.type.startsWith(
                "video/"
            )
        ){

            tipo = "video";
        }

        else if(
            arquivo.type.startsWith(
                "audio/"
            )
        ){

            tipo = "audio";
        }

        const { error } =

        await supabaseClient

        .from("chat")

        .insert({

            conversation_fk:
            chatAtivoId,

            account_fk:
            usuarioLogadoId,

            message:
            arquivo.name,

            file_url:
            data.publicUrl,

            file_type:
            tipo
        });

        if(error){

            console.error(error);
        }

        inputArquivo.value = "";
    }
);

// ======================================
// PESQUISA USUARIO
// ======================================

inputPesquisa.addEventListener(
    "input",

    async function(e){

        const termo =
        e.target.value.trim();

        if(!termo){

            carregarListaConversas();
            return;
        }

        const { data: usuarios } =

        await supabaseClient

        .from("account")

        .select("*")

        .ilike(
            "userName",
            `%${termo}%`
        )

        .limit(10);

        listaConversasArea.innerHTML = "";

        if(
            !usuarios ||
            usuarios.length === 0
        ){

            listaConversasArea.innerHTML = `
            
                <div class="p-4 text-center text-light opacity-50">
                    Nenhum usuário encontrado
                </div>
            
            `;

            return;
        }

        usuarios.forEach(user => {

            if(
                user.id ==
                usuarioLogadoId
            ) return;

            const nome =

            user.firstName ||
            user.userName;

            listaConversasArea.innerHTML += `

                <div
                    class="chat-user"
                    onclick="
                        criarContato(
                            ${user.id},
                            '${nome}'
                        )
                    "
                >

                    <div class="avatar">
                        ${nome.charAt(0)}
                    </div>

                    <div class="chat-user-info">

                        <h6>${nome}</h6>

                        <small>
                            @${user.userName}
                        </small>

                    </div>

                </div>

            `;
        });
    }
);

// ======================================
// CRIAR CONTATO
// ======================================

window.criarContato =
async function(userIdDestino, nome){

    const { data: contato } =

    await supabaseClient

    .from("contact")

    .select("*")

    .or(
`and(account_id.eq.${usuarioLogadoId},account_fk.eq.${userIdDestino}),and(account_id.eq.${userIdDestino},account_fk.eq.${usuarioLogadoId})`
    )

    .maybeSingle();

    let contatoId = null;

    if(contato){

        contatoId =
        contato.id;

    }else{

        const { data: novoContato } =

        await supabaseClient

        .from("contact")

        .insert({

            account_id:
            usuarioLogadoId,

            account_fk:
            userIdDestino,

            status: true
        })

        .select()

        .single();

        contatoId =
        novoContato.id;
    }

    abrirConversa(
        contatoId,
        nome
    );
};

// ======================================
// INIT
// ======================================

carregarListaConversas();
// ======================================
// FECHAR EMOJI AO CLICAR FORA
// ======================================

document.addEventListener(
    "click",
    function(e){

        const clicouNoPicker =
        emojiPicker.contains(
            e.target
        );

        const clicouNoBotao =
        btnEmoji.contains(
            e.target
        );

        if(
            !clicouNoPicker &&
            !clicouNoBotao
        ){

            emojiPicker.classList.add(
                "d-none"
            );
        }
    }
);

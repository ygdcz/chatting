<template>
  <header>
      <h1>人员在线列表</h1>
      <ul>
          <template v-for="userInfo of state.userList" :key="userInfo.id">
              <li v-if="userInfo.username === state.username">{{userInfo.username}}(这是您)</li>
              <li v-else>
                  <a href="javascript:void(0)" @click="() => selectUser(userInfo)">{{ userInfo.username }}</a>
              </li>
          </template>
      </ul>
      <div v-if="state.targetInfo">
          <div>
              <h1>{{state.targetInfo.username}}</h1>
              <input type="text" v-model="state.inputMessage" />
              <button :disabled="!state.inputMessage.length" @click="sendMessage">发送</button>
          </div>
          <div>
              <ul>
                  <li v-for="(message, index) of messageList" :key="index">
                      <p>
                          {{message.fromUsername === state.username ? "我" : message.fromUsername}}
                          {{new Date(message.dateTime)}}
                      </p>
                      <p>{{message.msg}}</p>
                  </li>
              </ul>
          </div>
      </div>
  </header>
</template>

<script setup>
import {io} from "socket.io-client";
import {useRouter} from "vue-router";
import {computed, reactive} from "vue";

const router = useRouter();
const state = reactive({
    username: router.currentRoute.value.query.username,
    userList: [],
    targetInfo: null,
    inputMessage: "",
    messageBox: {}
});

const messageList = computed(() => {
    return (state.messageBox[state.username] && state.targetInfo) ?
        state.messageBox[state.username].filter(item => {
            const {username} = state.targetInfo;
            return item.fromUsername === username ||
                   item.toUsername === username
        })
        : [];
});
const selectUser = (userInfo) => {
    state.targetInfo = userInfo;
}
const sendMessage = () => {
    const {username, id} = state.targetInfo;
    /**
     * {
     *   cd: [
     *     {
     *       fromUsername: xxx,
     *       toUsername: xxx,
     *       dateTime: xx,
     *       msg: xxx
     *     }
     *   ]
     * }
     */
    appendInfoIntoMessageBox({
        fromUsername: state.username,
        toUsername: username,
        dateTime: Date.now(),
        msg: state.inputMessage
    });

    socket.emit("send", {
        fromUsername: state.username,
        msg: state.inputMessage,
        targetId: id
    })
    state.inputMessage = "";
}
const appendInfoIntoMessageBox = (info) => {
    !state.messageBox[state.username] && (state.messageBox[state.username] = []);
    state.messageBox[state.username].push(info);
}

const socket = io("http://localhost:3000", {
    query: {
        username: state.username
    }
});
socket.on("online", (data) => {
    state.userList = data.userList;
    console.log("连接成功!")
});
socket.on("receive", (data) => {
    appendInfoIntoMessageBox(data);
})
socket.on("error", (err) => console.warn(err));
socket.on("disconnect", () => console.log("服务器断开连接"));
</script>

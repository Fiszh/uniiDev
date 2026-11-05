<script lang="ts">
  import Input from "$components/Input.svelte";
  import Button from "$components/inputs/Button.svelte";
  import LoginButton from "$components/LoginButton.svelte";

  const scopes = [
    "user:read:chat",
    "user:write:chat",
    "user:read:follows",
    "user:read:emotes",
    "user:read:blocked_users",
    "user:manage:blocked_users",
    "chat:read",
    "chat:edit",
    "channel:moderate",
    "whispers:read",
    "whispers:edit",
  ];

  let chatlyToken = $state("");

  const onToken = (token: string) => (chatlyToken = token);
  const onLogOut = () => (chatlyToken = "");

  function copyToken() {
    navigator.clipboard
      .writeText(chatlyToken)
      .then(() => {
        alert("Overlay URL has been copied!");
      })
      .catch((err) => {
        console.error("Failed to copy URL: ", err);
      });
  }
</script>

<section>
  <h1>Chatly user login</h1>
  {#if chatlyToken}
    <Input readonly type="password" value={chatlyToken} />
    <Button primary onclick={copyToken}>Copy Token</Button>
  {/if}
  <LoginButton
    {onToken}
    {onLogOut}
    {scopes}
    cookie="chatlyToken"
    clientId="21qux3t2dcl32rsxazz912b4kuulof"
  />
</section>

<style lang="scss">
  section {
    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    height: 100%;

    gap: 0.5rem;
  }
</style>

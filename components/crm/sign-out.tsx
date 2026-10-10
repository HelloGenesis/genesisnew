/** Sign out is a form post, never a link: a <Link> to it would be prefetched, and the prefetch would sign you out. */
export function SignOut({ className }: { className?: string }) {
  return (
    <form action="/signout" method="post" className="contents">
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}

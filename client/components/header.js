import Link from 'next/link';

const header = ({ currentUser }) => {
    // console.log(currentUser)
    // links 변수에  label, href를 케이스별로 객체로 묶고 각각의 객체에 대응하는 경우의
    // currentUser의 존재여부를 매치 시켜서 배열을 만든 다음 filter 메소드를 통해서
    // true일 경우에만 return 값을 반환하고 false일 경우는 탈락되도록 한다.
    // filter(linkConfig => linkConfig) 함수가 그것인데 처음보는 방식이라서 헷갈릴수
    // 있으니 주의한다. filter를 통과한 값은 배열로 나오는데 이것을 map 메소드를 통해서
    // html 요소로 만들어서 아래 최종 navbar의 return 값에 대입한다.
    const links = [
        !currentUser && { label: 'Sign up', href: '/auth/signup' },
        !currentUser && { label: 'Sign in', href: '/auth/signin' },
        currentUser && { label: 'Sell Tickets', href: '/tickets/new'},
        currentUser && { label: 'My Orders', href: '/orders'},
        currentUser && { label: 'Sign out', href: '/auth/signout'}
    ].filter(linkConfig => linkConfig)
     .map(({ label, href }) => {
        return (
            <li key={href} className="nav-item">
                <Link href={href}>
                    <a className="nav-link">{label}</a>
                </Link>
            </li>
        );
     });

    return (
      <nav className="navbar navbar-light bg-light">
          <Link href="/">
              <a className="navbar-brand">GitTix</a>
          </Link>
          <div className="d-flex justify-content-end">
            <ul className="nav d-flex align-items-center">
                {links}
            </ul>
          </div>
      </nav>  
    );
};

export default header;
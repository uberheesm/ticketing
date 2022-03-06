import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class Password {
    static async toHash(password: string) {
        const salt = randomBytes(8).toString('hex');
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        // 위의 as Buffer는 typescript에 있는 기능중에서 type assertions라는
        // 것으로 typescript가 해당 구문의 type을 모르고 추론해야 하는 경우에
        // 오류가 발생할 수 있는 경우를 대비해서 사람이 수동으로 type을 알려주는
        // 문법. 위의 예를 들면 구문 마지막에 as를 붙이고 그 다음에 type이 될 수
        // 있는 interface를 붙인다. 이것 말고도 제네릭 처럼 꺽쇠를 이용하는 방법
        // 이 있는데 이 방식은 구문 앞에 꺽쇠를 넣고 그 안에 interface를 넣는다.
        // type assertions는 실행에 전혀 영향을 미치지 않고 단지 type만 알려준다.
        // 앞에 꺽쇠를 넣는 방법은 react문법과 헷갈리는 경우가 있어서 잘 안쓴다.
        // 예1) const myCanvas = document.getElementById("main_canvas") as HTMLCanvasElement;
        // 예2) const myCanvas = <HTMLCanvasElement>document.getElementById("main_canvas");

        return `${buf.toString('hex')}.${salt}`;
    }

    static async compare(storedPassword: string, suppliedPassword: string) {
        const [hashedPassword, salt] = storedPassword.split('.');
        const buf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;

        return buf.toString('hex') === hashedPassword;
    }
}

// 위 class안의 method앞 static은 class에서 인스턴스를 만들지 않고 바로 사용
// 가능하다. 예를 들어 Password.toHash() 같이 말이다. 만약 static이 없다면
// 인스턴스를 만든 다음 접속 가능하다. 예를 들어 Password 클래스 안에 static없는
// print라는 method가 있으면 (new Password()).print() 이런 식으로 가능하다.
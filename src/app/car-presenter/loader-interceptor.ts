import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpEventType
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';
import { Injectable } from '@angular/core';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  private requests: HttpRequest<any>[] = [];
  totalSize = 0;
  downloadedSizeInfo: any = {};
  downloadedSize = 0;

  constructor(private loaderService: LoaderService) {}
  removeRequest(req: HttpRequest<any>) {
    const idx = this.requests.indexOf(req);
    if (idx >= 0) {
      this.requests.splice(idx, 1);
    }
    // this.loaderService.progressReport.next(
    //   this.totalSize === 0
    //     ? null
    //     : ((this.downloadedSize / this.totalSize) * 100).toFixed(2)
    // );
  }
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    this.requests.push(req);

    return Observable.create(observer => {
      const subscription = next.handle(req).subscribe(
        event => {
          if (event instanceof HttpResponse) {
            this.removeRequest(req);
            observer.next(event);
          }

          if (event.type === HttpEventType.DownloadProgress) {
            if (this.downloadedSizeInfo[req.url] === undefined) {
              this.totalSize += event.total;
            }
            this.downloadedSizeInfo[req.url] = event.loaded;
            this.downloadedSize = 0;
            for (const key in this.downloadedSizeInfo) {
              const size = this.downloadedSizeInfo[key];
              this.downloadedSize += size;
            }
            this.loaderService.progressReport.next(
              ((this.downloadedSize / this.totalSize) * 100).toFixed(2)
            );
            if (this.downloadedSize === this.totalSize) {
              this.downloadedSizeInfo = {};
              this.downloadedSize = 0;
              this.totalSize = 0;
            }
          }
        },
        err => {
          this.removeRequest(req);
          observer.error(err);
        },
        () => {
          this.removeRequest(req);
          observer.complete();
        }
      );
      return () => {
        this.removeRequest(req);
        subscription.unsubscribe();
      };
    });
  }
}

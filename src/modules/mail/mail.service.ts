import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, SendMailOptions } from 'nodemailer';

import { FunctionsService } from '../functions/functions.service';
import { GetEmailTemplateDto } from './dto/getEmailTemplate-mail.dto';

@Injectable()
export class MailService {
	constructor(
		private readonly config: ConfigService,
		private readonly functions: FunctionsService,
	) {}

	private getTransporter() {
		return createTransport({
			host: this.config.get('SMTP_HOST'),
			port: Number(this.config.get('SMTP_PORT')),
			secure: false,
			auth: {
				user: this.config.get('SMTP_USER'),
				pass: this.config.get('SMTP_PASS'),
			},
		});
	}

	async sendMail(options: SendMailOptions) {
		try {
			const transporter = this.getTransporter();

			const isOk = await transporter.verify();
			if (!isOk) {
				return this.functions.generateResponseApi(
					{
						status: 500,
						message: 'Oops! Error sending email.',
					},
					'Objet',
				);
			}

			const email = await transporter.sendMail({
				...options,
				priority: 'high',
			});

			return this.functions.generateResponseApi(
				{
					ok: true,
					status: 200,
					message: 'Well done! Email sent successfully.',
					data: [email],
				},
				'Objet',
			);
		} catch (error) {
			return this.functions.generateResponseApi(
				{
					status: 500,
					message: 'Oops! Error sending email.',
				},
				'Objet',
			);
		}
	}

	getEmailTemplate({ title, banner, subtitle, content, description, action, footer }: GetEmailTemplateDto) {
		return `
			<html>
			<head>
				<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<meta http-equiv="X-UA-Compatible" content="IE=edge" />
				<link rel="preconnect" href="https://fonts.googleapis.com">
				<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    			<link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
				
				<style type="text/css">
					/* CLIENT-SPECIFIC STYLES */
					body, table, td, a { 
						-webkit-text-size-adjust: 100%; 
						-ms-text-size-adjust: 100%; 
					}
					table, td { 
						mso-table-lspace: 0pt; 
						mso-table-rspace: 0pt; 
					}
					img { 
						-ms-interpolation-mode: bicubic; 
					}
					/* RESET STYLES */
					img { 
						border: 0; 
						height: auto; 
						line-height: 100%; 
						outline: none; 
						text-decoration: none; 
					}
					table { 
						border-collapse: 
						collapse !important; 
					}
					body { 
						height: 100% !important; 
						margin: 0 !important; 
						padding: 0 !important; 
						width: 100% !important; 
						font-family: 'Urbanist', sans-serif;
					}
					* {
						font-family: "Google Sans", sans-serif;
					}
					/* iOS BLUE LINKS */
					a[x-apple-data-detectors] {
						color: inherit !important;
						text-decoration: none !important;
						font-size: inherit !important;
						font-family: inherit !important;
						font-weight: inherit !important;
						line-height: inherit !important;
					}
			
					/* ANDROID CENTER FIX */
					div[style*="margin: 16px 0;"] { 
						margin: 0 !important; 
					}
				</style>
			</head>
			<body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
				<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 6px solid #06853C; border-bottom: 6px solid #06853C;">
					<!-- LOGO -->
					<tr>
						<td align="center">
							<table border="0" cellpadding="0" cellspacing="0" width="480" >
								<tr>
									<td align="center" valign="top" style="padding: 2rem 1rem;">
										<img
											alt="logo Cotrafa Social"
											src="https://cotrafasocial.com/wp-content/uploads/2023/09/logo-cotrafasocial.png"
											width="180"
											style="display: block; background-color: #f4f4f4;"
											border="0"
											bgcolor="#f4f4f4"
										>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<!-- TITLE -->
					<tr>
						<td align="center" style="padding: 0 1rem;">
							<table border="0" cellpadding="0" cellspacing="0" width="480" >
								<tr>
									<td bgcolor="#fefefe" align="center" valign="top" style="padding: 2rem 1rem; border-radius: 2rem 2rem 0 0;">
										<h1 style="font-size: 36px; font-weight: 900; margin: 0;">
											${title}
										</h1>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<!-- BANNER -->
					${
						!!banner
							? `
						<tr>
							<td align="center" style="padding: 0 1rem;">
								<table border="0" cellpadding="0" cellspacing="0" width="480" >
									<tr>
										<td bgcolor="#fefefe" align="center" valign="top" style="padding: 0 1rem 2rem">
											<img
												alt="advertising banner"
												src="${banner}"
												width="100%"
												style="display: block; border-radius: 1.5rem;"
												border="0"
											>
										</td>
									</tr>
								</table>
							</td>
						</tr>
					`
							: ''
					}
					<!-- COPY -->
					<tr>
						<td align="center" style="padding: 0 1rem;">
							<table border="0" cellpadding="0" cellspacing="0" width="480" >
								<!-- SUBTITLE -->
								<tr>
									<td bgcolor="#fefefe" align="center" style="padding: 1rem;" >
										<p style="margin: 0; text-align: center; font-size: 18px; font-weight: 400;">
											${subtitle}
										</p>
									</td>
								</tr>
								<!-- CONTENT -->
								<tr>
									<td bgcolor="#fefefe" align="center" style="padding: 2rem 1rem;" >
										<h2 style="font-size: 36px; line-height: 40px; font-weight: 700; text-align: center; margin: 0 0 .5rem; color: #06853C">
											${content}
										</h2>
										<p style="margin: 0; text-align: center; font-size: 14px;">
											${description}    
										</p>
									</td>
								</tr>
								<!-- ACTION BUTTON -->
								${
									!!action && !!action.title && !!action.url && !!action.description
										? `
									<tr>
										<td bgcolor="#fefefe " align="center" style="padding: 2rem 1rem;">
											<h4 style="margin: 0 0 .5rem; text-align: center;">
												${action.title}
											</h4>
											<p style="margin: 0; text-align: center; font-size: 14px;">
												Use
												<a
													href="${action.url}"
													target="_blank" 
													style="color: #06853C;"
												>
													this link
												</a>
												${action.description}
											</p>
										</td>
									</tr>
								`
										: ''
								}
							</table>
						</td>
					</tr>
					<!-- CALL TO KNOW MORE -->
					<tr>
						<td align="center" style="padding: 0 1rem;">
							<table border="0" cellpadding="0" cellspacing="0" width="480" >
								<tr>
									<td bgcolor="#06853C" align="center" style="padding: 2rem; border-radius: 0 0 2rem 2rem;" >
										<a
											href="https://cotrafasocial.com/"
											target="_blank"
											style="color: #000;font-size: 20px; font-weight: 500;"
										>
											www.cotrafasocial.com
										</a>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<!-- CALL TO SUPPORT -->
					<tr>
						<td align="center" style="padding: 2rem 1rem;">
							<table border="0" cellpadding="0" cellspacing="0" width="480" >
								<tr>
									<td bgcolor="#06853C" align="center" style="padding: 2rem; border-radius: 2rem;" >
										<h2 style="font-size: 24px; font-weight: 700; color: #000; margin: 0 0 .5rem;">
											¿Necesitas ayuda?
										</h2>
										<a
											href="mailto:lider.tic@cotrafasocial.com.co"
											style="color: #000;"
										>
											Soporte técnico
										</a>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<!-- FOOTER -->
					<tr>
						<td align="center" style="padding: 0 1rem;">
							<table border="0" cellpadding="0" cellspacing="0" width="480" >                    
								<tr>
									<td align="center" style="padding: 0 2rem 2rem; color: #555555; font-size: 14px;" >
										<p style="margin: 0 0 2rem;">
											${footer}
										</p>
										<p style="margin: 0;">
											2024 Cotrafa Social. Todos los derechos reservados. <br>
											Powered by Cotrafa Social.
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;
	}
}